import type { OrderResponseBody } from '@paypal/paypal-js';
import { describe, expect, it } from 'vitest';
import { resolveLines } from '@/lib/cart/resolve';
import { summarizeOrder } from '@/lib/paypal/summary';

const lines = resolveLines([
  { sku: 'CPROP-2', qty: 1 },
  { sku: 'PROP-KIT', qty: 3 },
]);

const details = {
  id: 'ORDER123',
  status: 'COMPLETED',
  payer: { email_address: 'buyer@example.com' },
  purchase_units: [
    {
      shipping: { name: { full_name: 'Pat Buyer' }, options: [{ id: 'usps-priority', label: 'USPS Priority Mail', selected: true }] },
      payments: { captures: [{ id: 'CAP456', status: 'COMPLETED', amount: { currency_code: 'USD', value: '44.46' } }] },
    },
  ],
} as unknown as OrderResponseBody;

describe('summarizeOrder', () => {
  it('extracts ids, payer, shipping, total, and lines', () => {
    const s = summarizeOrder(details, lines);
    expect(s.orderId).toBe('ORDER123');
    expect(s.captureId).toBe('CAP456');
    expect(s.status).toBe('COMPLETED');
    expect(s.payerEmail).toBe('buyer@example.com');
    expect(s.shippingName).toBe('Pat Buyer');
    expect(s.shippingLabel).toBe('USPS Priority Mail');
    expect(s.totalCents).toBe(4446);
    expect(s.lines).toEqual([
      { sku: 'CPROP-2', name: 'Custom Laser-cut Propeller – 2 sets', qty: 1, unitCents: 1299 },
      { sku: 'PROP-KIT', name: 'Propeller Kit', qty: 3, unitCents: 699 },
    ]);
  });

  it('collects post-purchase notes with the contact email filled in', () => {
    const s = summarizeOrder(details, lines);
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0]).toContain('orders@wrightstuffkits.com');
    expect(s.notes[0]).not.toContain('{contactEmail}');
  });

  it('tolerates missing optional fields', () => {
    const s = summarizeOrder({ id: 'X', status: 'COMPLETED' } as unknown as OrderResponseBody, lines);
    expect(s.captureId).toBeUndefined();
    expect(s.totalCents).toBe(0);
  });
});
