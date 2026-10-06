import { describe, expect, it } from 'vitest';
import { buildCatalog, filterProducts, minPriceCents } from '@/lib/catalog';
import type { ProductInput } from '@/lib/catalog/schema';

const base: ProductInput = {
  slug: 'test-kit',
  name: 'Test Kit',
  category: 'kits',
  summary: 'A test kit',
  description: 'Long text',
  images: [{ src: '/images/products/test-kit/1.jpg', alt: 'Test kit' }],
  variants: [{ sku: 'TEST-KIT', label: 'Default', priceCents: 1000 }],
};

describe('buildCatalog', () => {
  it('applies defaults', () => {
    const [p] = buildCatalog([base]);
    expect(p.notIncluded).toEqual([]);
    expect(p.featured).toBe(false);
    expect(p.variants[0].inStock).toBe(true);
    expect(p).not.toHaveProperty('specs');
    expect(p).not.toHaveProperty('included');
  });

  it('rejects duplicate slugs', () => {
    expect(() => buildCatalog([base, { ...base, variants: [{ sku: 'OTHER', label: 'x', priceCents: 1 }] }])).toThrow(/duplicate slug/i);
  });

  it('rejects duplicate SKUs across products', () => {
    expect(() => buildCatalog([base, { ...base, slug: 'other' }])).toThrow(/duplicate sku/i);
  });

  it('rejects bad slug and sku formats', () => {
    expect(() => buildCatalog([{ ...base, slug: 'Bad Slug' }])).toThrow();
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'bad sku', label: 'x', priceCents: 1 }] }]),
    ).toThrow();
  });

  it('rejects non-integer or non-positive prices', () => {
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'A', label: 'x', priceCents: 10.5 }] }]),
    ).toThrow();
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'A', label: 'x', priceCents: 0 }] }]),
    ).toThrow();
  });
});

describe('filterProducts and minPriceCents', () => {
  const catalog = buildCatalog([
    base,
    {
      ...base,
      slug: 'prop',
      name: 'Propeller Kit',
      summary: 'Premium balsa propeller set',
      category: 'propellers',
      tags: ['balsa'],
      variants: [
        { sku: 'P-2', label: '2 sets', priceCents: 1299 },
        { sku: 'P-3', label: '3 sets', priceCents: 1699 },
      ],
    },
  ]);

  it('filters by category', () => {
    expect(filterProducts(catalog, { category: 'propellers' }).map((p) => p.slug)).toEqual(['prop']);
  });

  it('filters by query over name, summary, tags (case-insensitive)', () => {
    expect(filterProducts(catalog, { q: 'BALSA' }).map((p) => p.slug)).toEqual(['prop']);
    expect(filterProducts(catalog, { q: 'test' }).map((p) => p.slug)).toEqual(['test-kit']);
    expect(filterProducts(catalog, { q: '   ' })).toHaveLength(2);
  });

  it('returns the lowest variant price', () => {
    expect(minPriceCents(catalog[1])).toBe(1299);
  });
});
