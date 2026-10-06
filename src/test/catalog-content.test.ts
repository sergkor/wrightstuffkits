import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { products, getVariant } from '@/lib/catalog';

const PUBLIC = path.resolve(__dirname, '../../public');

describe('catalog content', () => {
  it('has the six products', () => {
    expect(products.map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-elliptical-package',
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
    expect(getVariant('PKG-CLS-ELL')?.variant.priceCents).toBe(8499);
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

  it('four kits are featured, package last', () => {
    expect(products.filter((p) => p.featured).map((p) => p.slug)).toEqual([
      'beginner-kit',
      'classic-kit',
      'elliptical-kit',
      'classic-elliptical-package',
    ]);
  });

  it('package copy matches the change list', () => {
    const pkg = products.find((p) => p.slug === 'classic-elliptical-package')!;
    expect(pkg.category).toBe('kits');
    expect(pkg.summary).toMatch(/one Elliptical and one Classic/);
    expect(pkg.description).toContain('materials to build an Elliptical and Classic kit plane');
    expect(pkg.description).toContain('ready-to-use 24 cm PVC propeller');
    expect(pkg.images[0].src).toBe('/images/products/classic-elliptical-package/render.png');
    expect([pkg.name, pkg.summary, ...pkg.tags].join(' ')).not.toMatch(/mylar/i); // keeps the e2e "mylar" search at 2 results
  });

  it('kit copy matches the October 2026 change list', () => {
    const by = (slug: string) => products.find((p) => p.slug === slug)!;
    const elliptical = by('elliptical-kit');
    const classic = by('classic-kit');
    const beginner = by('beginner-kit');

    expect(`${elliptical.summary} ${elliptical.description}`).not.toMatch(/3\+/);
    for (const kit of [elliptical, classic]) {
      expect(kit.description).toContain('materials to build 2 balsa wood propellers');
      expect(kit.description).toContain('ready-to-use 24 cm PVC propeller');
    }
    expect(beginner.description).toContain('ready-to-use 24 cm PVC propeller');
    const beginnerText = [beginner.summary, beginner.description, ...beginner.tags, ...beginner.images.map((i) => i.alt)].join(' ');
    expect(beginnerText).not.toMatch(/ikara/i);
  });
});
