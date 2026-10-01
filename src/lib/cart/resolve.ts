import { getVariant, type Product, type Variant } from '@/lib/catalog';
import { lineTotalCents } from './pricing';

export interface CartItem {
  sku: string;
  qty: number;
}

export interface CartLine extends CartItem {
  product: Product;
  variant: Variant;
  lineTotalCents: number;
}

export function resolveLines(items: CartItem[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of items) {
    const hit = getVariant(item.sku);
    if (!hit) continue;
    lines.push({
      ...item,
      product: hit.product,
      variant: hit.variant,
      lineTotalCents: lineTotalCents(hit.variant.priceCents, item.qty),
    });
  }
  return lines;
}
