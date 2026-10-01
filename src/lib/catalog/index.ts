import { rawProducts } from '@/content/products';
import { CATEGORIES, ProductSchema, type Category, type Product, type ProductInput, type Variant } from './schema';

export { CATEGORIES };
export type { Category, Product, ProductInput, Variant };

export function buildCatalog(inputs: ProductInput[]): Product[] {
  const parsed = inputs.map((input, i) => {
    const result = ProductSchema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid product at index ${i} (${String(input.slug)}): ${result.error.message}`);
    }
    return result.data;
  });

  const slugs = new Set<string>();
  const skus = new Set<string>();
  for (const p of parsed) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
    for (const v of p.variants) {
      if (skus.has(v.sku)) throw new Error(`Duplicate SKU: ${v.sku} (product ${p.slug})`);
      skus.add(v.sku);
    }
  }
  return parsed;
}

export const products: Product[] = buildCatalog(rawProducts);

const bySlug = new Map(products.map((p) => [p.slug, p]));
const bySku = new Map<string, { product: Product; variant: Variant }>();
for (const product of products) for (const variant of product.variants) bySku.set(variant.sku, { product, variant });

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getVariant(sku: string): { product: Product; variant: Variant } | undefined {
  return bySku.get(sku);
}

export function minPriceCents(product: Product): number {
  return Math.min(...product.variants.map((v) => v.priceCents));
}

export function filterProducts(
  list: Product[],
  opts: { q?: string; category?: Category | '' },
): Product[] {
  const q = (opts.q ?? '').trim().toLowerCase();
  return list.filter((p) => {
    if (opts.category && p.category !== opts.category) return false;
    if (!q) return true;
    const hay = [p.name, p.summary, ...p.tags].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
