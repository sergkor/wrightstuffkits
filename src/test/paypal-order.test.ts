import { describe, expect, it } from 'vitest';
import { resolveLines } from '@/lib/cart/resolve';
import { buildAmountPatch, buildOrder } from '@/lib/paypal/order';

const lines = resolveLines([
  { sku: 'ELL-KIT', qty: 1 },
  { sku: 'CPROP-4', qty: 2 },
]);

describe('buildOrder', () => {
  const order = buildOrder(lines, 'usps-ground');
  const pu = order.purchase_units[0];

  it('is a CAPTURE order with one purchase unit', () => {
    expect(order.intent).toBe('CAPTURE');
    expect(order.purchase_units).toHaveLength(1);
  });

  it('lists items with sku, quantity, unit price, and physical category', () => {
    expect(pu.items).toEqual([
      { name: 'Elliptical Kit', sku: 'ELL-KIT', quantity: '1', unit_amount: { currency_code: 'USD', value: '75.99' }, category: 'PHYSICAL_GOODS' },
      { name: 'Custom Laser-cut Propeller – 4 sets', sku: 'CPROP-4', quantity: '2', unit_amount: { currency_code: 'USD', value: '20.99' }, category: 'PHYSICAL_GOODS' },
    ]);
  });

  it('amount equals items plus shipping with a matching breakdown', () => {
    expect(pu.amount).toEqual({
      currency_code: 'USD',
      value: '125.97',
      breakdown: { item_total: { currency_code: 'USD', value: '117.97' }, shipping: { currency_code: 'USD', value: '8.00' } },
    });
  });

  it('passes both shipping options with the chosen one selected', () => {
    expect(pu.shipping?.options?.map((o) => [o.id, o.selected, o.amount?.value])).toEqual([
      ['usps-ground', true, '8.00'],
      ['usps-priority', false, '10.50'],
    ]);
    const other = buildOrder(lines, 'usps-priority').purchase_units[0];
    expect(other.amount.value).toBe('128.47');
    expect(other.shipping?.options?.find((o) => o.id === 'usps-priority')?.selected).toBe(true);
  });

  it('falls back to the default option for an unknown shipping id', () => {
    expect(buildOrder(lines, 'nope').purchase_units[0].amount.value).toBe('125.97');
  });

  it('encodes skus in custom_id and asks PayPal to collect the address', () => {
    expect(pu.custom_id).toBe('ELL-KITx1,CPROP-4x2');
    expect(order.application_context?.shipping_preference).toBe('GET_FROM_FILE');
    expect(order.application_context?.user_action).toBe('PAY_NOW');
    expect(order.payment_source).toBeUndefined();
  });

  it('opens the PayPal login page instead of account sign-up for the PayPal button', () => {
    const paypal = buildOrder(lines, 'usps-ground', 'paypal');
    expect(paypal.payment_source).toEqual({
      paypal: {
        experience_context: { landing_page: 'LOGIN', shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
      },
    });
    expect(paypal.application_context).toBeUndefined();
  });

  it('keeps guest checkout for the card button', () => {
    const card = buildOrder(lines, 'usps-ground', 'card');
    expect(card.payment_source).toBeUndefined();
    expect(card.application_context?.shipping_preference).toBe('GET_FROM_FILE');
  });
});

describe('buildAmountPatch', () => {
  it('replaces the default purchase unit amount', () => {
    expect(buildAmountPatch(lines, 'usps-priority')).toEqual([
      {
        op: 'replace',
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: 'USD',
          value: '128.47',
          breakdown: { item_total: { currency_code: 'USD', value: '117.97' }, shipping: { currency_code: 'USD', value: '10.50' } },
        },
      },
    ]);
  });
});
