import { describe, expect, it } from 'vitest';
import { site } from '@/content/site';
import { resolveLines } from '@/lib/cart/resolve';
import { INVOICE_SUBJECT, invoiceBody, invoiceLine, invoiceMailtoHref } from '@/lib/invoice/request';

const lines = resolveLines([
  { sku: 'CLS-KIT', qty: 2 },
  { sku: 'CPROP-4', qty: 1 },
]);

describe('invoiceLine', () => {
  it('names a single-variant product plainly and multiplies the price by quantity', () => {
    expect(invoiceLine(lines[0])).toBe('2 x Classic Kit (CLS-KIT) - $151.98');
  });

  it('includes the variant label when a product has several', () => {
    expect(invoiceLine(lines[1])).toBe('1 x Custom Laser-cut Propeller - 4 sets (CPROP-4) - $20.99');
  });
});

describe('invoiceBody', () => {
  const body = invoiceBody(lines);

  it('lists every cart line and the items total', () => {
    expect(body).toContain('2 x Classic Kit (CLS-KIT) - $151.98');
    expect(body).toContain('1 x Custom Laser-cut Propeller - 4 sets (CPROP-4) - $20.99');
    expect(body).toContain('Items total: $172.97');
  });

  // The site never computes shipping, so the invoice must not imply a total the owner has to honour.
  it('leaves shipping to the invoice rather than quoting a figure', () => {
    expect(body).toContain('Shipping: to be added on the invoice');
  });

  it('asks for what raising a purchase order needs', () => {
    for (const field of ['Organization:', 'Shipping address:', 'Purchase order number', 'Needed by']) {
      expect(body).toContain(field);
    }
  });
});

describe('invoiceMailtoHref', () => {
  const href = invoiceMailtoHref(lines);

  it('addresses the shop with the invoice subject', () => {
    expect(href.startsWith(`mailto:${site.contactEmail}?`)).toBe(true);
    expect(href).toContain(encodeURIComponent(INVOICE_SUBJECT));
  });

  // URLSearchParams would encode spaces as "+", which mail clients show literally in the body.
  it('encodes spaces as %20 rather than plus', () => {
    expect(href).not.toContain('+');
    expect(href).toContain('%20');
  });

  it('round-trips back to the body it was built from', () => {
    const body = new URL(href).searchParams.get('body');
    expect(body).toBe(invoiceBody(lines));
  });
});
