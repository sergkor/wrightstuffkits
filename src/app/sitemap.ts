import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ['', 'products/', 'about/', 'faq/', 'contact/'].map((p) => ({ url: `${site.url}/${p}` }));
  const prods = products.map((p) => ({ url: `${site.url}/products/${p.slug}/` }));
  return [...statics, ...prods];
}
