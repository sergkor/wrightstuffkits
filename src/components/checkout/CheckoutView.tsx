'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { CartLineRow } from '@/components/cart/CartLineRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { ShippingNote } from '@/components/cart/ShippingNote';
import { Button } from '@/components/ui/button';
import { beginCheckoutEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/track';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { InvoiceRequest } from './InvoiceRequest';
import { PayPalCheckout } from './PayPalCheckout';

export function CheckoutView() {
  const hydrated = useCart((s) => s.hasHydrated);
  const lines = useCartLines();
  const reported = useRef(false);

  // Fires once the persisted cart has rehydrated, so the event carries real lines rather than none.
  useEffect(() => {
    if (reported.current || !hydrated || lines.length === 0) return;
    reported.current = true;
    track('begin_checkout', beginCheckoutEvent(lines));
  }, [hydrated, lines]);

  if (!hydrated) return null;
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4"><Link href="/products/">Browse products</Link></Button>
      </div>
    );
  }
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y">
        {lines.map((l) => (
          <CartLineRow key={l.sku} line={l} />
        ))}
      </ul>
      <aside className="space-y-4 rounded-lg border p-4">
        <CartSummary lines={lines} />
        <ShippingNote />
        <PayPalCheckout />
        <InvoiceRequest lines={lines} />
      </aside>
    </div>
  );
}
