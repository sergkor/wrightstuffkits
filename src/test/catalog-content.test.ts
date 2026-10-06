import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { products, getVariant } from '@/lib/catalog';

const PUBLIC = path.resolve(__dirname, '../../public');

describe('catalog content', () => {
  it('has the five launch products', () => {
    expect(products.map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-kit',
      'custom-propeller',
      'elliptical-kit',
      'propeller-kit',
    ]);
  });

  it('kits carry the renamed display names', () => {
    expect(products.find((p) => p.slug === 'elliptical-kit')?.name).toBe('Elliptical Kit');
    expect(products.find((p) => p.slug === 'classic-kit')?.name).toBe('Classic Kit');
    const text = products
      .map((p) => [p.name, p.summary, p.description, ...p.tags, ...p.images.map((i) => i.alt)].join(' '))
      .join(' ');
    expect(text).not.toMatch(/advanced|intermediate/i);
  });

  it('prices match inventory/kits.txt', () => {
    expect(getVariant('ELL-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('CLS-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('BEG-KIT')?.variant.priceCents).toBe(4999);
    expect(getVariant('PROP-KIT')?.variant.priceCents).toBe(699);
    expect(getVariant('CPROP-2')?.variant.priceCents).toBe(1299);
    expect(getVariant('CPROP-6')?.variant.priceCents).toBe(2899);
  });

  it('custom propeller has 5 set-count variants stepping by $4', () => {
    const p = products.find((x) => x.slug === 'custom-propeller')!;
    expect(p.variants.map((v) => v.priceCents)).toEqual([1299, 1699, 2099, 2499, 2899]);
    expect(p.optionLabel).toBe('Number of sets');
    expect(p.postPurchaseNote).toContain('{contactEmail}');
  });

  it('every image and download path exists under public/', () => {
    for (const p of products) {
      for (const img of p.images) expect(existsSync(path.join(PUBLIC, img.src)), img.src).toBe(true);
      for (const d of p.downloads) expect(existsSync(path.join(PUBLIC, d.href)), d.href).toBe(true);
    }
  });

  it('three kits are featured', () => {
    expect(products.filter((p) => p.featured).map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-kit',
      'elliptical-kit',
    ]);
  });
});
