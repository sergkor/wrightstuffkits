'use client';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/lib/format';
import { LAST_ORDER_KEY, type OrderSummary } from '@/lib/paypal/summary';

export function OrderConfirmation() {
  const [order, setOrder] = useState<OrderSummary | null | undefined>(undefined);

  /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage is only readable after mount (static export) */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      setOrder(raw ? (JSON.parse(raw) as OrderSummary) : null);
    } catch {
      setOrder(null);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (order === undefined) return null;
  if (order === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No recent order found.</p>
        <Button asChild className="mt-4"><Link href="/products/">Back to the shop</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6" data-testid="order-confirmation">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">Thanks for your order!</h1>
          <p className="text-sm text-muted-foreground">
            PayPal has emailed your receipt{order.payerEmail ? ` to ${order.payerEmail}` : ''}.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border p-4 text-sm">
        <dt className="text-muted-foreground">Order ID</dt><dd className="font-mono">{order.orderId}</dd>
        {order.captureId && (<><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono">{order.captureId}</dd></>)}
        {order.shippingName && (<><dt className="text-muted-foreground">Ship to</dt><dd>{order.shippingName}</dd></>)}
        {order.shippingLabel && (<><dt className="text-muted-foreground">Shipping</dt><dd>{order.shippingLabel}</dd></>)}
        <dt className="text-muted-foreground">Total</dt><dd className="font-medium">{formatCents(order.totalCents)}</dd>
      </dl>

      <ul className="divide-y rounded-lg border text-sm">
        {order.lines.map((l) => (
          <li key={l.sku} className="flex justify-between p-3">
            <span>{l.name} × {l.qty}</span>
            <span>{formatCents(l.unitCents * l.qty)}</span>
          </li>
        ))}
      </ul>

      {order.notes.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <p className="mb-1 font-semibold">One more step</p>
          {order.notes.map((n) => (<p key={n}>{n}</p>))}
        </div>
      )}

      <Button asChild variant="outline"><Link href="/products/">Continue shopping</Link></Button>
    </div>
  );
}
