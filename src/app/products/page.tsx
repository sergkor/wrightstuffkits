import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogView } from '@/components/catalog/CatalogView';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { products } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Shop', description: 'All kits and propeller supplies.' };

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Shop</h1>
      <Suspense fallback={<ProductGrid products={products} />}>
        <CatalogView />
      </Suspense>
    </main>
  );
}
