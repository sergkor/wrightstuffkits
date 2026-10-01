import { subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';
import { formatCents } from '@/lib/format';

export function CartSummary({ lines }: { lines: CartLine[] }) {
  return (
    <div className="flex items-center justify-between text-base font-medium">
      <span>Subtotal</span>
      <span data-testid="subtotal">{formatCents(subtotalCents(lines))}</span>
    </div>
  );
}
