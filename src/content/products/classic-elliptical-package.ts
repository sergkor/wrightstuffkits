import type { ProductInput } from '@/lib/catalog/schema';

export const classicEllipticalPackage: ProductInput = {
  slug: 'classic-elliptical-package',
  name: 'Classic + Elliptical Kit Package',
  category: 'kits',
  featured: true,
  summary: 'The Elliptical and Classic kits together. Both comply with Division C 2027 rules; includes propeller materials and instructions.',
  description: `This package comes with materials to build an Elliptical and Classic kit plane. Both comply with Division C 2027 Science Olympiad rules.

Comes with materials to build 2 propellers plus a ready-to-use 24 cm PVC propeller. Also includes step-by-step instructions covering assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/classic-elliptical-package/render.png', alt: 'Elliptical Kit and Classic Kit renderings side by side' },
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'PKG-CLS-ELL', label: 'Default', priceCents: 8499 }],
  tags: ['science olympiad', 'division c', 'package', 'bundle', 'classic', 'elliptical'],
};
