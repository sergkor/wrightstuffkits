import type { ProductInput } from '@/lib/catalog/schema';

export const classicKit: ProductInput = {
  slug: 'classic-kit',
  name: 'Classic Kit',
  category: 'kits',
  featured: true,
  summary: 'Highly competitive Division C 2027 flyer. Builds 2 planes. Mylar and carbon construction.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed to be highly competitive. Each kit has enough to build 2 planes.

Built around laser-cut balsa, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs that let you tune blade pitch, plus one ready-to-use 24 cm PVC propeller.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/classic-kit/render.png', alt: 'Classic Kit rendering with rectangular Mylar wings' },
    { src: '/images/products/classic-kit/1.jpg', alt: 'Classic Kit built plane, top view' },
    { src: '/images/products/classic-kit/2.jpg', alt: 'Classic Kit built plane, angled view' },
    { src: '/images/products/classic-kit/3.jpg', alt: 'Classic Kit with balsa propeller and fin' },
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'CLS-KIT', label: 'Default', priceCents: 7599 }],
  tags: ['science olympiad', 'division c', 'mylar', 'carbon', 'classic'],
};
