import type { ProductInput } from '@/lib/catalog/schema';

export const advancedKit: ProductInput = {
  slug: 'advanced-kit',
  name: 'Advanced Kit',
  category: 'kits',
  featured: true,
  summary: 'Max-duration Division C 2027 flyer. Builds 2 planes. Designed for 3+ minute flights.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed for maximum possible flight time (designed for 3+ minutes). Each kit has enough to build 2 planes.

Built around laser-cut balsa and plywood parts, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs to tune blade pitch.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming...`,
  images: [
    { src: '/images/products/advanced-kit/render.png', alt: 'Advanced Kit rendering with elliptical wing and endplate stabilizer' },
    { src: '/images/products/advanced-kit/1.jpg', alt: 'Advanced Kit built plane, side view' },
    { src: '/images/products/advanced-kit/2.jpg', alt: 'Advanced Kit built plane, top view' },
    { src: '/images/products/advanced-kit/3.jpg', alt: 'Advanced Kit wing and stabilizer detail' },
    { src: '/images/products/advanced-kit/4.jpg', alt: 'Advanced Kit front view with balsa propeller' },
  ],
  specs: {
    'Rules compliance': 'Science Olympiad Division C 2027',
    'Planes per kit': '2',
    Covering: 'Mylar',
    Structure: 'Laser-cut balsa and plywood, carbon fiber rods',
    Propeller: '2 buildable balsa props with adjustable-pitch hubs',
    'Target flight time': '3+ minutes',
  },
  included: [
    'Laser-cut balsa and plywood parts',
    'Carbon fiber rods',
    'Mylar covering',
    'Materials and jig for 2 balsa propellers',
    'Adjustable propeller hubs',
    '1/8" FAI rubber',
    'O-rings',
    'Step-by-step instructions (assembly, motor making, winding, trimming)',
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'ADV-KIT', label: 'Default', priceCents: 7599 }],
  tags: ['science olympiad', 'division c', 'mylar', 'carbon', 'advanced'],
};
