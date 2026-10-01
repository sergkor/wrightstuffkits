'use client';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartCount } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';

export function CartTrigger() {
  const count = useCartCount();
  const open = useCart((s) => s.open);
  return (
    <Button variant="ghost" size="icon" aria-label={`Open cart, ${count} items`} onClick={open} data-testid="cart-trigger">
      <span className="relative">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span
            data-testid="cart-count"
            className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
          >
            {count}
          </span>
        )}
      </span>
    </Button>
  );
}
