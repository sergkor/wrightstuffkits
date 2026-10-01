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

// Storage can be missing (SSR) or blocked (private mode, quota, site-data settings), and even
// touching `localStorage` may throw a SecurityError. Every storage call goes through this guard so
// a failure degrades to an in-memory cart instead of breaking add/remove or hydration.
function guardStorage(inner: StateStorage): StateStorage {
  return {
    getItem: (k) => {
      try {
        return inner.getItem(k);
      } catch {
        return null;
      }
    },
    setItem: (k, v) => {
      try {
        return inner.setItem(k, v);
      } catch {
        // ignore: the cart keeps working in memory
      }
    },
    removeItem: (k) => {
      try {
        return inner.removeItem(k);
      } catch {
        // ignore
      }
    },
  };
}

// The `typeof localStorage` checks run inside guardStorage's try, so a throwing accessor is caught.
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
  const store = createStore<CartState>()(
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
        storage: createJSONStorage(() => guardStorage(storage)),
        partialize: (s) => ({ items: s.items }),
        skipHydration: true,
        // `state` is undefined when rehydration fails; the store must still count as hydrated
        // or the UI would wait forever. `store` is read lazily, after createStore has returned.
        onRehydrateStorage: () => (state) => {
          state?.prune();
          store.setState({ hasHydrated: true });
        },
      },
    ),
  );
  return store;
}

export const cartStore = createCartStore();

export function useCart<T>(selector: (s: CartState) => T): T {
  return useStore(cartStore, selector);
}
