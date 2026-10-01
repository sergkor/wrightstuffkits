'use client';
import { useEffect, useMemo } from 'react';
import { itemCount } from './pricing';
import { resolveLines, type CartLine } from './resolve';
import { cartStore, useCart } from './store';

/** Mount once (root layout). Rehydrates the persisted cart after first paint so SSG HTML matches. */
export function useCartHydration(): void {
  useEffect(() => {
    void cartStore.persist.rehydrate();
  }, []);
}

export function useCartLines(): CartLine[] {
  const items = useCart((s) => s.items);
  return useMemo(() => resolveLines(items), [items]);
}

export function useCartCount(): number {
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hasHydrated);
  return hydrated ? itemCount(items) : 0;
}
