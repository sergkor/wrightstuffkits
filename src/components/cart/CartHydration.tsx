'use client';
import { useCartHydration } from '@/lib/cart/hooks';

export function CartHydration() {
  useCartHydration();
  return null;
}
