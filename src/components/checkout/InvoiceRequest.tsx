import type { CartLine } from '@/lib/cart/resolve';
import { invoiceMailtoHref } from '@/lib/invoice/request';

export function InvoiceRequest({ lines }: { lines: CartLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="space-y-1 border-t pt-4">
      <a className="text-sm underline" href={invoiceMailtoHref(lines)} data-testid="invoice-request">
        Need an invoice or purchase order?
      </a>
      <p className="text-xs text-muted-foreground">
        For schools and clubs that pay by PO or check. Opens an email with your cart filled in; we reply within one
        business day.
      </p>
    </div>
  );
}
