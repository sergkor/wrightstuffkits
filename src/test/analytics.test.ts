import { describe, expect, it } from 'vitest';
import { addToCartEvent, beginCheckoutEvent, purchaseEvent } from '@/lib/analytics/events';
import { claimPurchase } from '@/lib/analytics/purchase-sent';
import { resolveLines } from '@/lib/cart/resolve';
import type { OrderSummary } from '@/lib/paypal/summary';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

const throwingStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('SecurityError');
  },
} as unknown as Storage;

describe('addToCartEvent', () => {
  it('builds a GA4 item from a cart line', () => {
    const [line] = resolveLines([{ sku: 'CPROP-3', qty: 2 }]);
    expect(addToCartEvent(line)).toEqual({
      currency: 'USD',
      value: 33.98,
      items: [
        {
          item_id: 'CPROP-3',
          item_name: 'Custom Laser-cut Propeller – 3 sets',
          item_category: 'propellers',
          item_variant: '3 sets',
          price: 16.99,
          quantity: 2,
        },
      ],
    });
  });

  it('omits item_variant for a single-variant product', () => {
    const [line] = resolveLines([{ sku: 'ELL-KIT', qty: 1 }]);
    const event = addToCartEvent(line);
    expect(event.items[0].item_name).toBe('Elliptical Kit');
    expect(event.items[0].item_variant).toBeUndefined();
  });
});

describe('beginCheckoutEvent', () => {
  it('sums the cart in dollars', () => {
    const lines = resolveLines([
      { sku: 'ELL-KIT', qty: 1 },
      { sku: 'PROP-KIT', qty: 2 },
    ]);
    const event = beginCheckoutEvent(lines);
    expect(event.value).toBe(89.97);
    expect(event.currency).toBe('USD');
    expect(event.items.map((i) => i.item_id)).toEqual(['ELL-KIT', 'PROP-KIT']);
  });

  it('reports zero for an empty cart', () => {
    expect(beginCheckoutEvent([])).toEqual({ currency: 'USD', value: 0, items: [] });
  });
});

describe('purchaseEvent', () => {
  const order: OrderSummary = {
    orderId: '5O190127TN364715T',
    captureId: '3C679366HH908993F',
    status: 'COMPLETED',
    totalCents: 8399,
    lines: [{ sku: 'ELL-KIT', name: 'Elliptical Kit', qty: 1, unitCents: 7599 }],
    notes: [],
  };

  it('maps an order summary, deriving shipping from the total', () => {
    expect(purchaseEvent(order)).toEqual({
      transaction_id: '5O190127TN364715T',
      currency: 'USD',
      value: 83.99,
      shipping: 8,
      items: [{ item_id: 'ELL-KIT', item_name: 'Elliptical Kit', price: 75.99, quantity: 1 }],
    });
  });

  it('floors shipping at zero when the total is below the line sum', () => {
    expect(purchaseEvent({ ...order, totalCents: 7000 }).shipping).toBe(0);
  });
});

describe('claimPurchase', () => {
  it('returns true the first time and false afterwards', () => {
    const storage = memoryStorage();
    expect(claimPurchase('order-1', storage)).toBe(true);
    expect(claimPurchase('order-1', storage)).toBe(false);
  });

  it('claims again when the order id changes', () => {
    const storage = memoryStorage();
    expect(claimPurchase('order-1', storage)).toBe(true);
    expect(claimPurchase('order-2', storage)).toBe(true);
  });

  it('sends once per load when storage is unavailable', () => {
    expect(claimPurchase('order-1', throwingStorage)).toBe(true);
    expect(claimPurchase('order-1', throwingStorage)).toBe(true);
  });
});
