import type { ProductInput } from '@/lib/catalog/schema';

export const customPropeller: ProductInput = {
  slug: 'custom-propeller',
  name: 'Custom Laser-cut Propeller',
  category: 'propellers',
  summary: 'Your propeller design laser-cut from 1/32" balsa, with hubs and forming tube.',
  description: `We laser-cut your propeller design from 1/32" balsa. Two sets for $12.99, plus $4 for each additional set (including multiple different designs).

Comes with adjustable propeller hubs, a 4 x 2 inch cardboard tube for wet-forming the balsa, and everything else needed to complete the propeller.

After ordering, email your design in any format (DXF preferred; an image works if you also give a size).`,
  images: [{ src: '/images/products/custom-propeller/1.jpg', alt: 'Laser-cut balsa propeller example' }],
  specs: { Material: '1/32" balsa', Hub: 'Adjustable pitch', 'Forming tube': '4 x 2 inch cardboard' },
  included: ['Laser-cut blades for each set', 'Adjustable propeller hubs', 'Cardboard forming tube'],
  notIncluded: ['Super glue (CA)'],
  optionLabel: 'Number of sets',
  variants: [
    { sku: 'CPROP-2', label: '2 sets', priceCents: 1299 },
    { sku: 'CPROP-3', label: '3 sets', priceCents: 1699 },
    { sku: 'CPROP-4', label: '4 sets', priceCents: 2099 },
    { sku: 'CPROP-5', label: '5 sets', priceCents: 2499 },
    { sku: 'CPROP-6', label: '6 sets', priceCents: 2899 },
  ],
  postPurchaseNote:
    'Email your propeller design (DXF preferred, or any image plus a size) and your PayPal order ID to {contactEmail}.',
  tags: ['propeller', 'custom', 'laser', 'balsa'],
};
