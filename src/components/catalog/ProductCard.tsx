import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { minPriceCents, type Product } from '@/lib/catalog';
import { formatCents } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.variants.every((v) => !v.inStock);
  const multi = product.variants.length > 1;
  return (
    <Link
      href={`/products/${product.slug}/`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
      data-testid="product-card"
    >
      <div className="relative aspect-[4/3] bg-muted">
        <Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        {soldOut && <Badge variant="secondary" className="absolute left-2 top-2">Sold out</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold group-hover:underline">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.summary}</p>
        <p className="mt-auto pt-2 font-medium">
          {multi ? 'From ' : ''}
          {formatCents(minPriceCents(product))}
        </p>
      </div>
    </Link>
  );
}
