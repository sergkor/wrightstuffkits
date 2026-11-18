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

// PayPal honors purchase_unit shipping options, and fires onShippingChange, only for its own
// account-based sources. On the unbranded card flow the callback never fires for a guest buyer, so
// the options stay unresolved and PayPal rejects the order at approval with the misleading
// "Your order can't be shipped to this address." Card buyers therefore get no shipping choice; the
// default option is already priced into `amount`. An unknown source is treated as card: a buyer who
// cannot pick a shipping speed is a far smaller problem than one who cannot check out at all.
const SHIPPING_OPTION_SOURCES = ['paypal', 'venmo'];

function offersShippingOptions(fundingSource?: string): boolean {
  return fundingSource !== undefined && SHIPPING_OPTION_SOURCES.includes(fundingSource);
}

// fundingSource is the button the buyer clicked (createOrder's data.paymentSource).
export function buildOrder(lines: CartLine[], shippingId: string, fundingSource?: string): CreateOrderRequestBody {
  const chosen = resolveShippingId(shippingId);
  const experience = { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' } as const;
  // For the PayPal button, open the login page: the default (NO_PREFERENCE) shows account sign-up
  // to unrecognized browsers. Other buttons (card) keep PayPal's guest flow.
  const context =
    fundingSource === 'paypal'
      ? { payment_source: { paypal: { experience_context: { landing_page: 'LOGIN' as const, ...experience } } } }
      : { application_context: experience };
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
        ...(offersShippingOptions(fundingSource)
          ? {
              shipping: {
                options: site.shippingOptions.map((o) => ({
                  id: o.id,
                  label: o.label,
                  type: 'SHIPPING' as const,
                  selected: o.id === chosen,
                  amount: usd(o.amountCents),
                })),
              },
            }
          : {}),
      },
    ],
    ...context,
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
