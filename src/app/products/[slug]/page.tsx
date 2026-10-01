import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Description } from '@/components/product/Description';
import { Downloads } from '@/components/product/Downloads';
import { Gallery } from '@/components/product/Gallery';
import { IncludedList } from '@/components/product/IncludedList';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { SpecTable } from '@/components/product/SpecTable';
import { site } from '@/content/site';
import { getProduct, minPriceCents, products } from '@/lib/catalog';

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    openGraph: { title: p.name, description: p.summary, images: [{ url: p.images[0].src }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary,
    image: product.images.map((i) => `${site.url}${i.src}`),
    sku: product.variants[0].sku,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: (minPriceCents(product) / 100).toFixed(2),
      highPrice: (Math.max(...product.variants.map((v) => v.priceCents)) / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.inStock) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery images={product.images} />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">{product.summary}</p>
          </div>
          <PurchasePanel product={product} />
          <Description text={product.description} />
        </div>
      </div>
      <div className="mt-12 space-y-10">
        <SpecTable specs={product.specs} />
        <IncludedList included={product.included} notIncluded={product.notIncluded} />
        <Downloads downloads={product.downloads} />
      </div>
    </main>
  );
}
