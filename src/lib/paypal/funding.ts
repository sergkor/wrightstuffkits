import type { FUNDING_SOURCE } from '@paypal/paypal-js';

// PayPal resolves shipping only for its own account-backed funding sources. Two separate mechanisms
// depend on this and both must agree, which is why they share one list:
//
//   1. `purchase_units[].shipping.options` — the shipping speeds offered on the order.
//   2. `onShippingChange` — re-pricing the order when the buyer changes address or speed. Merely
//      registering it makes the SDK tell PayPal's hosted page `hasShippingCallback=true`.
//
// The unbranded card flow supports neither. PayPal never invokes the callback for a guest card
// buyer, so an order that advertised one cannot resolve its shipping and PayPal refuses it with
// "Your order can't be shipped to this address." Verified by experiment: the same standalone card
// button reports hasShippingCallback=false without the callback and true with it.
//
// Card buyers therefore get no shipping choice. The default option is priced into the order amount,
// so they pay a flat rate.
export const SHIPPING_AWARE_SOURCES = ['paypal', 'paylater', 'venmo'] as const satisfies readonly FUNDING_SOURCE[];

// The buttons the checkout renders, each as its own instance so the card button can differ. Venmo
// needs enable-funding=venmo on the SDK options to be eligible at all, and even then it requires a
// US buyer with the Venmo app — desktop buyers scan a QR code. An ineligible source renders
// nothing, so listing it here is safe.
export const BUTTON_SOURCES = ['paypal', 'paylater', 'venmo', 'card'] as const satisfies readonly FUNDING_SOURCE[];

// An unknown or missing source is treated as card: a buyer who cannot pick a shipping speed is a far
// smaller problem than one who cannot check out at all.
export function resolvesShipping(fundingSource?: string): boolean {
  return fundingSource !== undefined && (SHIPPING_AWARE_SOURCES as readonly string[]).includes(fundingSource);
}
