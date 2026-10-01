import { beforeEach, describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createCartStore } from '@/lib/cart/store';

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('cart store', () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it('adds and merges quantities', () => {
    const store = createCartStore(storage);
    store.getState().add('ADV-KIT');
    store.getState().add('ADV-KIT', 2);
    expect(store.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 3 }]);
  });

  it('setQty updates and removes at zero', () => {
    const store = createCartStore(storage);
    store.getState().add('PROP-KIT', 2);
    store.getState().setQty('PROP-KIT', 5);
    expect(store.getState().items[0].qty).toBe(5);
    store.getState().setQty('PROP-KIT', 0);
    expect(store.getState().items).toEqual([]);
  });

  it('remove and clear', () => {
    const store = createCartStore(storage);
    store.getState().add('A');
    store.getState().add('B');
    store.getState().remove('A');
    expect(store.getState().items.map((i) => i.sku)).toEqual(['B']);
    store.getState().clear();
    expect(store.getState().items).toEqual([]);
  });

  it('open/close drawer', () => {
    const store = createCartStore(storage);
    expect(store.getState().isOpen).toBe(false);
    store.getState().open();
    expect(store.getState().isOpen).toBe(true);
    store.getState().close();
    expect(store.getState().isOpen).toBe(false);
  });

  it('persists only items and rehydrates on demand', async () => {
    const a = createCartStore(storage);
    a.getState().add('ADV-KIT', 2);
    a.getState().open();
    expect(storage.data.get('wsk-cart-v1')).toContain('ADV-KIT');
    expect(storage.data.get('wsk-cart-v1')).not.toContain('isOpen');

    const b = createCartStore(storage);
    expect(b.getState().hasHydrated).toBe(false);
    expect(b.getState().items).toEqual([]);
    await b.persist.rehydrate();
    expect(b.getState().hasHydrated).toBe(true);
    expect(b.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 2 }]);
  });

  it('prunes unknown SKUs on rehydrate', async () => {
    storage.setItem(
      'wsk-cart-v1',
      JSON.stringify({ state: { items: [{ sku: 'ADV-KIT', qty: 1 }, { sku: 'GONE', qty: 9 }] }, version: 0 }),
    );
    const store = createCartStore(storage);
    await store.persist.rehydrate();
    expect(store.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 1 }]);
  });

  it('still hydrates with an empty cart when storage getItem throws', async () => {
    const broken: StateStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    const store = createCartStore(broken);
    await store.persist.rehydrate();
    expect(store.getState().hasHydrated).toBe(true);
    expect(store.getState().items).toEqual([]);
  });

  it('keeps working in memory when storage setItem throws', () => {
    const full: StateStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    const store = createCartStore(full);
    expect(() => store.getState().add('ADV-KIT')).not.toThrow();
    expect(store.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 1 }]);
  });
});
