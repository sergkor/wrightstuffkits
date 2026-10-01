import type { OrderResponseBody } from '@paypal/paypal-js';
import { site } from '@/content/site';
import type { CartLine } from '@/lib/cart/resolve';
import { fillTemplate } from '@/lib/format';
import { lineName } from './order';

export const LAST_ORDER_KEY = 'wsk-last-order';

export interface OrderSummary {
  orderId: string;
  captureId?: string;
  status: string;
  payerEmail?: string;
  shippingName?: string;
  shippingLabel?: string;
  totalCents: number;
  lines: { sku: string; name: string; qty: number; unitCents: number }[];
  notes: string[];
}

export function summarizeOrder(details: OrderResponseBody, lines: CartLine[]): OrderSummary {
  const pu = details.purchase_units?.[0];
  const capture = pu?.payments?.captures?.[0];
  const totalValue = capture?.amount?.value;
  const notes = Array.from(
    new Set(lines.map((l) => l.product.postPurchaseNote).filter((n): n is string => Boolean(n))),
  ).map((n) => fillTemplate(n, { contactEmail: site.contactEmail }));

  return {
    orderId: details.id ?? '',
    captureId: capture?.id,
    status: capture?.status ?? details.status ?? 'UNKNOWN',
    payerEmail: details.payer?.email_address,
    shippingName: pu?.shipping?.name?.full_name,
    shippingLabel: pu?.shipping?.options?.find((o) => o.selected)?.label,
    totalCents: totalValue ? Math.round(Number(totalValue) * 100) : 0,
    lines: lines.map((l) => ({ sku: l.sku, name: lineName(l), qty: l.qty, unitCents: l.variant.priceCents })),
    notes,
  };
}
