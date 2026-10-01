import type { Metadata } from 'next';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

export default function OrderConfirmedPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <OrderConfirmation />
    </main>
  );
}
