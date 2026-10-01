'use client';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CartLine } from '@/lib/cart/resolve';
import { useCart } from '@/lib/cart/store';
import { formatCents } from '@/lib/format';

export function CartLineRow({ line }: { line: CartLine }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const multi = line.product.variants.length > 1;
  return (
    <li className="flex gap-3 py-3" data-testid="cart-line">
      <div className="relative size-16 shrink-0 overflow-hidden rounded border bg-muted">
        <Image src={line.product.images[0].src} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 text-sm">
        <Link href={`/products/${line.product.slug}/`} className="font-medium hover:underline">{line.product.name}</Link>
        {multi && <span className="text-muted-foreground">{line.variant.label}</span>}
        <div className="mt-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-7" aria-label="Decrease quantity" onClick={() => setQty(line.sku, line.qty - 1)}>
            <Minus className="size-3" />
          </Button>
          <span className="w-6 text-center">{line.qty}</span>
          <Button variant="outline" size="icon" className="size-7" aria-label="Increase quantity" onClick={() => setQty(line.sku, line.qty + 1)}>
            <Plus className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-1 size-7" aria-label={`Remove ${line.product.name}`} onClick={() => remove(line.sku)}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-medium">{formatCents(line.lineTotalCents)}</div>
    </li>
  );
}
