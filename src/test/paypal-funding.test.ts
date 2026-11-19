import { describe, expect, it } from 'vitest';
import { BUTTON_SOURCES, resolvesShipping, SHIPPING_AWARE_SOURCES } from '@/lib/paypal/funding';

describe('resolvesShipping', () => {
  it('is true for the PayPal account-backed sources', () => {
    for (const source of SHIPPING_AWARE_SOURCES) expect(resolvesShipping(source)).toBe(true);
    expect([...SHIPPING_AWARE_SOURCES]).toEqual(['paypal', 'paylater', 'venmo']);
  });

  // The bug: PayPal refused every address on the card button with "Your order can't be shipped to
  // this address." because the order advertised a shipping callback PayPal never invokes for a guest
  // card buyer. Card must resolve no shipping at all — neither options nor the callback.
  it('is false for the unbranded card flow', () => {
    expect(resolvesShipping('card')).toBe(false);
  });

  it('is false for an unknown or missing source, so an unrecognized button still checks out', () => {
    expect(resolvesShipping(undefined)).toBe(false);
    expect(resolvesShipping('sofort')).toBe(false);
    expect(resolvesShipping('')).toBe(false);
  });
});

describe('BUTTON_SOURCES', () => {
  it('renders the card button, and renders it as a source that resolves no shipping', () => {
    expect([...BUTTON_SOURCES]).toContain('card');
    expect(resolvesShipping('card')).toBe(false);
  });

  it('renders the PayPal buttons that do keep the shipping picker', () => {
    const shippingAware = BUTTON_SOURCES.filter((s) => resolvesShipping(s));
    expect([...shippingAware]).toEqual(['paypal', 'paylater', 'venmo']);
  });
});
