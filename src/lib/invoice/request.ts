import { site } from '@/content/site';
import { subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';
import { formatCents } from '@/lib/format';

// Schools and clubs often cannot pay by card at all: they need an invoice to raise a purchase
// order, or they pay by check. This builds a mailto so the buyer's own mail client carries the cart
// over — no server, and no payment processor involved.

export const INVOICE_SUBJECT = 'Invoice / purchase order request';

export function invoiceLine(line: CartLine): string {
  const name = line.product.variants.length > 1 ? `${line.product.name} - ${line.variant.label}` : line.product.name;
  return `${line.qty} x ${name} (${line.sku}) - ${formatCents(line.variant.priceCents * line.qty)}`;
}

export function invoiceBody(lines: CartLine[]): string {
  // Shipping is left blank on purpose: the site never computes it, PayPal does, and an invoice goes
  // out by hand anyway.
  return [
    'Please send an invoice for:',
    '',
    ...lines.map(invoiceLine),
    '',
    `Items total: ${formatCents(subtotalCents(lines))}`,
    'Shipping: to be added on the invoice',
    '',
    'Organization:',
    'Billing contact and email:',
    'Shipping address:',
    'Purchase order number (if you have one):',
    'Needed by (date):',
    '',
    'Thank you,',
  ].join('\n');
}

export function invoiceMailtoHref(lines: CartLine[]): string {
  const query = new URLSearchParams({ subject: INVOICE_SUBJECT, body: invoiceBody(lines) });
  // URLSearchParams encodes spaces as "+", which mail clients render literally in the body.
  return `mailto:${site.contactEmail}?${query.toString().replace(/\+/g, '%20')}`;
}
