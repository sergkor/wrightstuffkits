import type { CartItem, CartLine } from './resolve';

export function lineTotalCents(priceCents: number, qty: number): number {
  return priceCents * qty;
}

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
}

export function itemCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
