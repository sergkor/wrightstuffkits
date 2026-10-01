import { requireEnv } from '@/lib/env';

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
  tagline: 'Science Olympiad free-flight kits and propeller supplies',
  // Placeholder. Replace before launch (see docs/PAYPAL_SETUP.md checklist).
  contactEmail: 'orders@wrightstuffkits.com',
  usOnly: true,
  shippingOptions: [
    { id: 'usps-ground', label: 'USPS Ground Advantage', amountCents: 650, selected: true },
    { id: 'usps-priority', label: 'USPS Priority Mail', amountCents: 1050, selected: false },
  ] as ShippingOption[],
  // Inlined at build time by Next.js; the build fails if unset.
  paypalClientId: requireEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
};

export function defaultShippingOption(): ShippingOption {
  return site.shippingOptions.find((o) => o.selected) ?? site.shippingOptions[0];
}

export function getShippingOption(id: string): ShippingOption | undefined {
  return site.shippingOptions.find((o) => o.id === id);
}
