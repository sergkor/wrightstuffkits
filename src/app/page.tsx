import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export default function HomePage() {
  const featured = products.filter((p) => p.featured);
  const propellers = products.filter((p) => p.category === 'propellers');

  return (
    <main>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Science Olympiad Division C 2027</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">Rubber-Powered Plane Kits</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {site.tagline}. Laser-cut parts, carbon fiber rods, covering, and other building supplies with step-by-step instructions that cover building and flight testing.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link href="/products/?cat=kits">Shop kits</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/products/?cat=propellers">Propellers</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Featured kits</h2>
        <ProductGrid products={featured} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Propellers</h2>
        <ProductGrid products={propellers} />
      </section>
    </main>
  );
}
