import { Button } from '@/components/ui/button';

// A PayPal no-code payment button: a plain form POST to a PayPal-hosted checkout page, with no JS
// SDK involved. That is the point of it — buyers blocked by the SDK's card flow still have a way to
// pay, and PayPal collects the shipping address on its own page.
//
// PayPal holds the price and the item name for these buttons, so this renders no amount: a figure
// here could silently disagree with what the buyer is charged. See docs/PAYPAL_SETUP.md.
export function HostedPayPalButton({ hostedButtonId }: { hostedButtonId: string }) {
  return (
    <form
      action={`https://www.paypal.com/ncp/payment/${hostedButtonId}`}
      method="post"
      target="_blank"
      rel="noopener noreferrer"
      className="space-y-1"
    >
      <Button type="submit" variant="outline" className="w-full" data-testid="hosted-paypal-button">
        Pay on PayPal instead
      </Button>
      <p className="text-xs text-muted-foreground">
        Opens PayPal directly, without the checkout above. Use this if the card option gives you an address error.
      </p>
    </form>
  );
}
