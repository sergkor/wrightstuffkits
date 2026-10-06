import type { ProductInput } from '@/lib/catalog/schema';

export const propellerKit: ProductInput = {
  slug: 'propeller-kit',
  name: 'Propeller Kit',
  category: 'propellers',
  summary: 'Materials and jig to build 2 balsa propellers with adjustable-pitch hubs.',
  description: `Includes materials and a jig to build 2 balsa wood propellers for Science Olympiad models using 1/32" balsa. Optimized design made for maximum flight time. Includes a hub with an adjustable pitch angle.`,
  images: [{ src: '/images/products/propeller-kit/1.jpg', alt: 'Finished balsa propeller with adjustable hub' }],
  notIncluded: ['Super glue (CA)', 'Hobby knife'],
  variants: [{ sku: 'PROP-KIT', label: 'Default', priceCents: 699 }],
  tags: ['propeller', 'balsa', 'hub'],
};
