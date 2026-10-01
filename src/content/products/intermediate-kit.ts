import type { ProductInput } from '@/lib/catalog/schema';

export const intermediateKit: ProductInput = {
  slug: 'intermediate-kit',
  name: 'Intermediate Kit',
  category: 'kits',
  featured: true,
  summary: 'Highly competitive Division C 2027 flyer. Builds 2 planes. Mylar and carbon construction.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed to be highly competitive. Each kit has enough to build 2 planes.

Built around laser-cut balsa, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs that let you tune blade pitch.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/intermediate-kit/render.png', alt: 'Intermediate Kit rendering with rectangular Mylar wings' },
    { src: '/images/products/intermediate-kit/1.jpg', alt: 'Intermediate Kit built plane, top view' },
    { src: '/images/products/intermediate-kit/2.jpg', alt: 'Intermediate Kit built plane, angled view' },
    { src: '/images/products/intermediate-kit/3.jpg', alt: 'Intermediate Kit with balsa propeller and fin' },
  ],
  specs: {
    'Rules compliance': 'Science Olympiad Division C 2027',
    'Planes per kit': '2',
    Covering: 'Mylar',
    Structure: 'Laser-cut balsa, carbon fiber rods',
    Propeller: '2 buildable balsa props with adjustable-pitch hubs',
  },
  included: [
    'Laser-cut balsa parts',
    'Carbon fiber rods',
    'Mylar covering',
    'Materials and jig for 2 balsa propellers',
    'Adjustable propeller hubs',
    '1/8" FAI rubber',
    'O-rings',
    'Step-by-step instructions (assembly, motor making, winding, trimming)',
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'INT-KIT', label: 'Default', priceCents: 7599 }],
  tags: ['science olympiad', 'division c', 'mylar', 'carbon', 'intermediate'],
};
