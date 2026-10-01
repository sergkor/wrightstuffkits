'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { CartLineRow } from './CartLineRow';
import { CartSummary } from './CartSummary';
import { ShippingNote } from './ShippingNote';

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const open = useCart((s) => s.open);
  const lines = useCartLines();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? open() : close())}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {lines.map((l) => (
                <CartLineRow key={l.sku} line={l} />
              ))}
            </ul>
            <Separator />
            <div className="space-y-3 p-4">
              <CartSummary lines={lines} />
              <ShippingNote />
              <div data-testid="paypal-slot" />
              <Button asChild variant="outline" className="w-full" onClick={close}>
                <Link href="/checkout/">Review order</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
