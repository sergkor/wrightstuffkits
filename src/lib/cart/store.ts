import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { getVariant } from '@/lib/catalog';
import type { CartItem } from './resolve';

export const CART_STORAGE_KEY = 'wsk-cart-v1';

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  add: (sku: string, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setHydrated: () => void;
  prune: () => void;
}

const browserStorage: StateStorage = {
  getItem: (k) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: (k, v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

export function createCartStore(storage: StateStorage = browserStorage) {
  return createStore<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        hasHydrated: false,
        add: (sku, qty = 1) =>
          set((s) => {
            const existing = s.items.find((i) => i.sku === sku);
            const items = existing
              ? s.items.map((i) => (i.sku === sku ? { ...i, qty: i.qty + qty } : i))
              : [...s.items, { sku, qty }];
            return { items };
          }),
        setQty: (sku, qty) =>
          set((s) => ({
            items:
              qty <= 0
                ? s.items.filter((i) => i.sku !== sku)
                : s.items.map((i) => (i.sku === sku ? { ...i, qty } : i)),
          })),
        remove: (sku) => set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),
        clear: () => set({ items: [] }),
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        setHydrated: () => set({ hasHydrated: true }),
        prune: () => set({ items: get().items.filter((i) => getVariant(i.sku) !== undefined) }),
      }),
      {
        name: CART_STORAGE_KEY,
        storage: createJSONStorage(() => storage),
        partialize: (s) => ({ items: s.items }),
        skipHydration: true,
        onRehydrateStorage: () => (state) => {
          state?.prune();
          state?.setHydrated();
        },
      },
    ),
  );
}

export const cartStore = createCartStore();

export function useCart<T>(selector: (s: CartState) => T): T {
  return useStore(cartStore, selector);
}
