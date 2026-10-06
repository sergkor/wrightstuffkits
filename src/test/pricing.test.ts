import { describe, expect, it } from 'vitest';
import { itemCount, lineTotalCents, subtotalCents } from '@/lib/cart/pricing';
import { resolveLines } from '@/lib/cart/resolve';

describe('pricing', () => {
  it('multiplies in integer cents', () => {
    expect(lineTotalCents(1299, 3)).toBe(3897);
    expect(lineTotalCents(699, 0)).toBe(0);
  });

  it('sums line totals', () => {
    const lines = resolveLines([
      { sku: 'ELL-KIT', qty: 1 },
      { sku: 'PROP-KIT', qty: 2 },
    ]);
    expect(subtotalCents(lines)).toBe(7599 + 1398);
    expect(subtotalCents([])).toBe(0);
  });

  it('counts items', () => {
    expect(itemCount([{ sku: 'A', qty: 2 }, { sku: 'B', qty: 3 }])).toBe(5);
  });
});

describe('resolveLines', () => {
  it('joins catalog data and drops unknown SKUs', () => {
    const lines = resolveLines([
      { sku: 'CPROP-3', qty: 1 },
      { sku: 'NOPE', qty: 4 },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].product.slug).toBe('custom-propeller');
    expect(lines[0].variant.label).toBe('3 sets');
    expect(lines[0].lineTotalCents).toBe(1699);
  });
});
