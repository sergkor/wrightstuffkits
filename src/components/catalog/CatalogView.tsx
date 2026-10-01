'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { filterProducts, products, type Category } from '@/lib/catalog';
import { CategorySchema } from '@/lib/catalog/schema';
import { CategoryFilter } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import { SearchBox } from './SearchBox';

export function CatalogView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = params.get('q') ?? '';
  const catParam = params.get('cat') ?? '';
  const category: Category | '' = CategorySchema.safeParse(catParam).success ? (catParam as Category) : '';

  const update = useCallback(
    (next: { q?: string; cat?: string }) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const visible = useMemo(() => filterProducts(products, { q, category }), [q, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter value={category} onChange={(c) => update({ cat: c })} />
        <SearchBox value={q} onChange={(v) => update({ q: v })} />
      </div>
      <ProductGrid products={visible} />
    </div>
  );
}
