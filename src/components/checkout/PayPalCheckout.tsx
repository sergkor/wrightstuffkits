'use client';
import type { FUNDING_SOURCE, OrderResponseBody } from '@paypal/paypal-js';
import { BUTTON_SOURCES, resolvesShipping } from '@/lib/paypal/funding';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { orderingPause } from '@/content/ordering';
import { defaultShippingOption, site } from '@/content/site';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { buildAmountPatch, buildOrder } from '@/lib/paypal/order';
import { LAST_ORDER_KEY, summarizeOrder } from '@/lib/paypal/summary';

// enableFunding becomes enable-funding on the SDK URL. PayPal keeps widening Venmo eligibility and
// recommends asking for it explicitly; without this the Venmo button never renders.
const SDK_OPTIONS = {
  clientId: site.paypalClientId,
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
  enableFunding: 'venmo',
};
const DECLINED_MSG = 'That payment method was declined. Please choose another.';
const FAILED_MSG = 'PayPal could not complete the payment. Your cart is unchanged.';
const SHIPPING_MSG = 'We could not update shipping for that address. Please try again, or email us and we will take the order by hand.';

export function PayPalCheckout() {
  const lines = useCartLines();
  const clear = useCart((s) => s.clear);
  const close = useCart((s) => s.close);
  const router = useRouter();
  const shippingRef = useRef(defaultShippingOption().id);
  const [error, setError] = useState<string | null>(null);
  // Set once a capture is classified as paid. clear() then unmounts the buttons while the SDK
  // may still fire onError/onCancel; those must not tell the buyer the payment failed.
  // The ref guards callbacks synchronously; the state mirror drives rendering.
  const paidRef = useRef(false);
  const [paid, setPaid] = useState(false);

  // A cart persists in the buyer's browser, so someone can reach checkout with items added before
  // the pause. Sold-out labels alone would not stop them paying for stock we do not have. Still let
  // a buyer mid-payment through, so a capture already in flight can finish and show its receipt.
  if (orderingPause && !paid) {
    return (
      <div data-testid="paypal-buttons" className="space-y-1">
        <p role="status" className="text-sm font-medium">{orderingPause.heading}</p>
        <p className="text-sm text-muted-foreground">{orderingPause.body}</p>
      </div>
    );
  }

  if (lines.length === 0) {
    if (!paid) return null;
    return (
      <div data-testid="paypal-buttons" className="space-y-2">
        <p role="status" className="text-sm text-muted-foreground">Payment received, redirecting…</p>
      </div>
    );
  }
  const cartKey = lines.map((l) => `${l.sku}:${l.qty}`).join('|');

  // Each funding source is rendered as its own button so the card flow can omit onShippingChange.
  // The source is therefore known here, which also beats relying on createOrder's data.paymentSource.
  const createOrder = (fundingSource: FUNDING_SOURCE) => () => {
    setError(null);
    shippingRef.current = defaultShippingOption().id;
    return buildOrder(lines, shippingRef.current, fundingSource);
  };

  return (
    <div data-testid="paypal-buttons" className="space-y-2">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <PayPalScriptProvider options={SDK_OPTIONS}>
        {BUTTON_SOURCES.map((fundingSource) => (
          <PayPalButtons
            key={fundingSource}
            fundingSource={fundingSource}
            style={{ layout: 'vertical', shape: 'rect' }}
            forceReRender={[cartKey]}
            createOrder={(_data, actions) => actions.order.create(createOrder(fundingSource)())}
            // Legacy callback: the only client-side way to re-price shipping without a server.
            // PayPal marks it deprecated, but the v5 SDK that PayPalScriptProvider loads still serves it.
            // Withheld from the card button on purpose; see lib/paypal/funding.ts.
            onShippingChange={
              resolvesShipping(fundingSource)
                ? async (data, actions) => {
                    if (site.usOnly && data.shipping_address && data.shipping_address.country_code !== 'US') {
                      return actions.reject();
                    }
                    const selected = data.selected_shipping_option?.id;
                    if (selected) shippingRef.current = selected;
                    try {
                      return await actions.order.patch(buildAmountPatch(lines, shippingRef.current));
                    } catch {
                      // Rejecting is the only way to stop an order whose total no longer matches the
                      // chosen shipping, but PayPal words every rejection as an address problem. Show
                      // the real reason in our own UI so the buyer is not left hunting for a bad address.
                      setError(SHIPPING_MSG);
                      return actions.reject();
                    }
                  }
                : undefined
            }
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
                const declined =
                  issue === 'INSTRUMENT_DECLINED' ||
                  String((err as Error)?.message ?? err).includes('INSTRUMENT_DECLINED');
                if (declined) {
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
              paidRef.current = true;
              setPaid(true);
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
            onCancel={() => {
              if (paidRef.current) return;
              setError(null);
            }}
            onError={() => {
              if (paidRef.current) return;
              setError(FAILED_MSG);
              toast.error(FAILED_MSG);
            }}
          />
        ))}
      </PayPalScriptProvider>
    </div>
  );
}
