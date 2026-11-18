import { optionalEnv, requireEnv } from '@/lib/env';

export interface ShippingOption {
  id: string;
  label: string;
  amountCents: number;
  selected: boolean;
}

export const site = {
  name: 'Wright Stuff Kits',
  domain: 'wrightstuffkits.com',
  url: 'https://wrightstuffkits.com',
  tagline: 'Free-flight kits and propeller supplies',
  // Placeholder. Replace before launch (see docs/PAYPAL_SETUP.md checklist).
  contactEmail: 'orders@wrightstuffkits.com',
  usOnly: true,
  shippingOptions: [
    { id: 'usps-ground', label: 'USPS Ground Advantage', amountCents: 800, selected: true },
    { id: 'usps-priority', label: 'USPS Priority Mail', amountCents: 1050, selected: false },
  ] as ShippingOption[],
  // Inlined at build time by Next.js; the build fails if unset.
  paypalClientId: requireEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
  // GA4 measurement ID (public, appears in page source). Optional on purpose: unset means no tag,
  // which keeps local dev and PR builds out of the production property.
  gaMeasurementId: optionalEnv(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
};

export function defaultShippingOption(): ShippingOption {
  return site.shippingOptions.find((o) => o.selected) ?? site.shippingOptions[0];
}

export function getShippingOption(id: string): ShippingOption | undefined {
  return site.shippingOptions.find((o) => o.id === id);
}
