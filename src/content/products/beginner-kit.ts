import type { ProductInput } from '@/lib/catalog/schema';

export const beginnerKit: ProductInput = {
  slug: 'beginner-kit',
  name: 'Beginner Kit',
  category: 'kits',
  featured: true,
  summary: 'Robust tissue-covered Division C 2027 flyer for first-time builders. Builds 2 planes.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is great for beginners and people who are new to the event. Each kit has enough to build 2 planes.

While slightly heavier (about 9.5 g), it is built to be robust with laser-cut balsa, plywood parts, and tissue covering. Comes with a single Ikara 24 cm propeller.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/beginner-kit/render.png', alt: 'Beginner Kit rendering with blue tissue wings' },
    { src: '/images/products/beginner-kit/1.jpg', alt: 'Beginner Kit built plane, top view' },
    { src: '/images/products/beginner-kit/2.jpg', alt: 'Beginner Kit built plane with Ikara propeller' },
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'BEG-KIT', label: 'Default', priceCents: 4999 }],
  tags: ['science olympiad', 'division c', 'tissue', 'beginner', 'ikara'],
};
