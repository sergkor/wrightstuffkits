import Image from 'next/image';
import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export default function HomePage() {
  const featured = products.filter((p) => p.featured);
  const propellers = products.filter((p) => p.category === 'propellers');
  const compare = featured.map((p) => ({
    name: p.name,
    slug: p.slug,
    covering: p.specs.Covering ?? '—',
    propeller: p.specs.Propeller ?? '—',
    weight: p.specs['Approx. weight'] ?? '—',
    flight: p.specs['Target flight time'] ?? '—',
  }));

  return (
    <main>
      <section className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 px-4 py-16 md:flex-row md:justify-between md:py-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Science Olympiad Division C 2027</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">Rubber-powered flyer kits built to win.</h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              {site.tagline}. Laser-cut parts, Mylar or tissue covering, and instructions that cover building, winding, and trimming.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg"><Link href="/products/?cat=kits">Shop kits</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/products/?cat=propellers">Propellers</Link></Button>
            </div>
          </div>
          <Image
            src="/images/brand/logo.png"
            alt={`${site.name} logo`}
            width={512}
            height={512}
            priority
            className="size-48 shrink-0 drop-shadow-md md:size-64 lg:size-72"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Featured kits</h2>
        <ProductGrid products={featured} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-4 text-2xl font-semibold">Which kit?</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="p-3">Kit</th><th scope="col" className="p-3">Covering</th><th scope="col" className="p-3">Propeller</th><th scope="col" className="p-3">Weight</th><th scope="col" className="p-3">Flight</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((r) => (
                <tr key={r.slug} className="border-t">
                  <th scope="row" className="p-3 font-medium text-left"><Link href={`/products/${r.slug}/`} className="underline-offset-2 hover:underline">{r.name}</Link></th>
                  <td className="p-3">{r.covering}</td><td className="p-3">{r.propeller}</td><td className="p-3">{r.weight}</td><td className="p-3">{r.flight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Propellers</h2>
        <ProductGrid products={propellers} />
      </section>
    </main>
  );
}
