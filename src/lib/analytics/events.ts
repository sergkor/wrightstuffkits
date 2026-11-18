import { lineTotalCents, subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';
import { lineName } from '@/lib/paypal/order';
import type { OrderSummary } from '@/lib/paypal/summary';

// GA4 recommended-event payloads. Kept free of browser and gtag imports so they stay unit-testable;
// `track` in ./track does the sending.

const CURRENCY = 'USD';

export interface GaItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface GaCartEvent {
  currency: string;
  value: number;
  items: GaItem[];
}

export interface GaPurchaseEvent extends GaCartEvent {
  transaction_id: string;
  shipping: number;
}

/** GA4 wants major units, so prices cross the boundary as dollars while the cart stays in cents. */
function dollars(cents: number): number {
  return Math.round(cents) / 100;
}

function itemFromLine(line: CartLine): GaItem {
  return {
    item_id: line.sku,
    item_name: lineName(line),
    item_category: line.product.category,
    ...(line.product.variants.length > 1 ? { item_variant: line.variant.label } : {}),
    price: dollars(line.variant.priceCents),
    quantity: line.qty,
  };
}

export function addToCartEvent(line: CartLine): GaCartEvent {
  return { currency: CURRENCY, value: dollars(line.lineTotalCents), items: [itemFromLine(line)] };
}

export function beginCheckoutEvent(lines: CartLine[]): GaCartEvent {
  return { currency: CURRENCY, value: dollars(subtotalCents(lines)), items: lines.map(itemFromLine) };
}

export function purchaseEvent(order: OrderSummary): GaPurchaseEvent {
  const itemsCents = order.lines.reduce((sum, l) => sum + lineTotalCents(l.unitCents, l.qty), 0);
  return {
    transaction_id: order.orderId,
    currency: CURRENCY,
    value: dollars(order.totalCents),
    // The capture total includes shipping chosen in PayPal; the difference is the only split we have.
    shipping: dollars(Math.max(0, order.totalCents - itemsCents)),
    items: order.lines.map((l) => ({
      item_id: l.sku,
      item_name: l.name,
      price: dollars(l.unitCents),
      quantity: l.qty,
    })),
  };
}
