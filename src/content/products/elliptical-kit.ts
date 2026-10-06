import type { ProductInput } from '@/lib/catalog/schema';

export const ellipticalKit: ProductInput = {
  slug: 'elliptical-kit',
  name: 'Elliptical Kit',
  category: 'kits',
  featured: true,
  summary: 'Max-duration Division C 2027 flyer. Builds 2 planes. Designed for 3+ minute flights.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed for maximum possible flight time (designed for 3+ minutes). Each kit has enough to build 2 planes.

Built around laser-cut balsa and plywood parts, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs to tune blade pitch.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/elliptical-kit/render.png', alt: 'Elliptical Kit rendering with elliptical wing and endplate stabilizer' },
    { src: '/images/products/elliptical-kit/1.jpg', alt: 'Elliptical Kit built plane, side view' },
    { src: '/images/products/elliptical-kit/2.jpg', alt: 'Elliptical Kit built plane, top view' },
    { src: '/images/products/elliptical-kit/3.jpg', alt: 'Elliptical Kit wing and stabilizer detail' },
    { src: '/images/products/elliptical-kit/4.jpg', alt: 'Elliptical Kit front view with balsa propeller' },
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'ELL-KIT', label: 'Default', priceCents: 7599 }],
  tags: ['science olympiad', 'division c', 'mylar', 'carbon', 'elliptical'],
};
