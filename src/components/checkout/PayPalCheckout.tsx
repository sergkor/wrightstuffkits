'use client';
import type { OrderResponseBody } from '@paypal/paypal-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { defaultShippingOption, site } from '@/content/site';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { buildAmountPatch, buildOrder } from '@/lib/paypal/order';
import { LAST_ORDER_KEY, summarizeOrder } from '@/lib/paypal/summary';

const SDK_OPTIONS = { clientId: site.paypalClientId, currency: 'USD', intent: 'capture', components: 'buttons' };
const DECLINED_MSG = 'That payment method was declined. Please choose another.';
const FAILED_MSG = 'PayPal could not complete the payment. Your cart is unchanged.';

export function PayPalCheckout() {
  const lines = useCartLines();
  const clear = useCart((s) => s.clear);
  const close = useCart((s) => s.close);
  const router = useRouter();
  const shippingRef = useRef(defaultShippingOption().id);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) return null;
  const cartKey = lines.map((l) => `${l.sku}:${l.qty}`).join('|');

  return (
    <div data-testid="paypal-buttons" className="space-y-2">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <PayPalScriptProvider options={SDK_OPTIONS}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect' }}
          forceReRender={[cartKey]}
          createOrder={(_data, actions) => {
            setError(null);
            shippingRef.current = defaultShippingOption().id;
            return actions.order.create(buildOrder(lines, shippingRef.current));
          }}
          // Legacy callback: the only client-side way to re-price shipping without a server.
          // PayPal marks it deprecated, but the v5 SDK that PayPalScriptProvider loads still serves it.
          onShippingChange={async (data, actions) => {
            if (site.usOnly && data.shipping_address && data.shipping_address.country_code !== 'US') {
              return actions.reject();
            }
            const selected = data.selected_shipping_option?.id;
            if (selected) shippingRef.current = selected;
            return actions.order.patch(buildAmountPatch(lines, shippingRef.current));
          }}
          onApprove={async (_data, actions) => {
            const fail = () => {
              setError(FAILED_MSG);
              toast.error(FAILED_MSG);
            };
            if (!actions.order) return fail();
            let details: OrderResponseBody;
            try {
              details = await actions.order.capture();
            } catch (err) {
              const issue = (err as { details?: { issue?: string }[] })?.details?.[0]?.issue;
              if (issue === 'INSTRUMENT_DECLINED') {
                setError(DECLINED_MSG);
                return actions.restart();
              }
              return fail();
            }
            const status = details.purchase_units?.[0]?.payments?.captures?.[0]?.status;
            if (status === 'DECLINED') {
              setError(DECLINED_MSG);
              return actions.restart();
            }
            // Only a completed (or pending) capture counts as paid; FAILED or a missing capture keeps the cart.
            if (status !== 'COMPLETED' && status !== 'PENDING') return fail();
            // Payment is taken from here on: a storage failure must never block clearing the cart or
            // navigating, and must never tell the buyer the payment failed. The confirmation page
            // falls back to "No recent order found" when the summary is missing.
            try {
              sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summarizeOrder(details, lines)));
            } catch {
              // ignore: see above
            }
            clear();
            close();
            router.push('/order/confirmed/');
          }}
          onCancel={() => setError(null)}
          onError={() => {
            setError(FAILED_MSG);
            toast.error(FAILED_MSG);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
