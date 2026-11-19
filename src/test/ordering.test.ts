import { describe, expect, it } from 'vitest';
import { isOrderingPaused, orderingPause } from '@/content/ordering';
import { products } from '@/lib/catalog';

describe('ordering pause', () => {
  it('reports paused exactly when a notice is configured', () => {
    expect(isOrderingPaused()).toBe(orderingPause !== null);
  });

  it('carries a heading and an explanation when paused', () => {
    if (!orderingPause) return;
    expect(orderingPause.heading.length).toBeGreaterThan(0);
    // The buyer needs to know it is temporary and that nothing can be bought, not just "sold out".
    expect(orderingPause.body.length).toBeGreaterThan(40);
  });
});

// Restock-safe on purpose: these assert the two switches agree, whichever way they are set, so a
// half-finished restock — stock flags cleared but the banner left up, or the reverse — fails here.
describe('pause and catalog stock agree', () => {
  const allVariants = products.flatMap((p) => p.variants);

  it('has variants to check', () => {
    expect(allVariants.length).toBeGreaterThan(0);
  });

  it('advertises nothing as in stock while ordering is paused', () => {
    if (!isOrderingPaused()) return;
    const stocked = allVariants.filter((v) => v.inStock).map((v) => v.sku);
    expect(stocked).toEqual([]);
  });

  it('has something in stock once ordering resumes', () => {
    if (isOrderingPaused()) return;
    expect(allVariants.some((v) => v.inStock)).toBe(true);
  });
});
