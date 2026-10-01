import type { CreateOrderRequestBody, PatchOrderRequestBody } from '@paypal/paypal-js';
import { defaultShippingOption, getShippingOption, site } from '@/content/site';
import { subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';

const usd = (cents: number) => ({ currency_code: 'USD', value: (cents / 100).toFixed(2) });

export function lineName(line: CartLine): string {
  return line.product.variants.length > 1 ? `${line.product.name} – ${line.variant.label}` : line.product.name;
}

function resolveShippingId(shippingId: string): string {
  return (getShippingOption(shippingId) ?? defaultShippingOption()).id;
}

function amountFor(lines: CartLine[], shippingId: string) {
  const shipping = getShippingOption(resolveShippingId(shippingId))!;
  const itemTotal = subtotalCents(lines);
  return {
    ...usd(itemTotal + shipping.amountCents),
    breakdown: { item_total: usd(itemTotal), shipping: usd(shipping.amountCents) },
  };
}

export function buildOrder(lines: CartLine[], shippingId: string): CreateOrderRequestBody {
  const chosen = resolveShippingId(shippingId);
  return {
    intent: 'CAPTURE',
    purchase_units: [
      {
        custom_id: lines.map((l) => `${l.sku}x${l.qty}`).join(','),
        items: lines.map((l) => ({
          name: lineName(l),
          sku: l.sku,
          quantity: String(l.qty),
          unit_amount: usd(l.variant.priceCents),
          category: 'PHYSICAL_GOODS' as const,
        })),
        amount: amountFor(lines, chosen),
        shipping: {
          options: site.shippingOptions.map((o) => ({
            id: o.id,
            label: o.label,
            type: 'SHIPPING' as const,
            selected: o.id === chosen,
            amount: usd(o.amountCents),
          })),
        },
      },
    ],
    application_context: { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
  };
}

export function buildAmountPatch(lines: CartLine[], shippingId: string): PatchOrderRequestBody {
  return [
    {
      op: 'replace',
      path: "/purchase_units/@reference_id=='default'/amount",
      value: amountFor(lines, resolveShippingId(shippingId)),
    },
  ];
}
