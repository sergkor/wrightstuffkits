'use client';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart/store';
import { formatCents } from '@/lib/format';
import { VariantSelector } from './VariantSelector';

export function PurchasePanel({ product }: { product: Product }) {
  const firstInStock = product.variants.find((v) => v.inStock) ?? product.variants[0];
  const [sku, setSku] = useState(firstInStock.sku);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const clear = useCart((s) => s.clear);
  const router = useRouter();

  const variant = product.variants.find((v) => v.sku === sku) ?? firstInStock;
  const soldOut = !variant.inStock;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold" data-testid="price">{formatCents(variant.priceCents)}</span>
        {soldOut && <Badge variant="secondary">Sold out</Badge>}
      </div>

      {product.variants.length > 1 && (
        <VariantSelector label={product.optionLabel ?? 'Option'} variants={product.variants} value={sku} onChange={setSku} />
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Qty</span>
        <Button type="button" variant="outline" size="icon" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center" data-testid="qty">{qty}</span>
        <Button type="button" variant="outline" size="icon" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={soldOut}
          data-testid="add-to-cart"
          onClick={() => {
            add(variant.sku, qty);
            open();
          }}
        >
          Add to cart
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={soldOut}
          data-testid="buy-now"
          onClick={() => {
            clear();
            add(variant.sku, qty);
            router.push('/checkout/');
          }}
        >
          Buy now with PayPal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Shipping options and any tax are chosen in PayPal. US addresses only.</p>
    </div>
  );
}
