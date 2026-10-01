import { z } from 'zod';

export const CategorySchema = z.enum(['kits', 'propellers']);
export type Category = z.infer<typeof CategorySchema>;

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'kits', label: 'Kits' },
  { value: 'propellers', label: 'Propellers' },
];

export const VariantSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'sku must be upper-case letters, digits, dashes'),
  label: z.string().min(1),
  priceCents: z.number().int().positive(),
  inStock: z.boolean().default(true),
});

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lower-case letters, digits, dashes'),
  name: z.string().min(1),
  category: CategorySchema,
  summary: z.string().min(1).max(200),
  description: z.string().min(1),
  images: z.array(z.object({ src: z.string().startsWith('/'), alt: z.string().min(1) })).min(1),
  specs: z.record(z.string(), z.string()).default({}),
  included: z.array(z.string()).default([]),
  notIncluded: z.array(z.string()).default([]),
  downloads: z.array(z.object({ label: z.string().min(1), href: z.string().startsWith('/') })).default([]),
  variants: z.array(VariantSchema).min(1),
  optionLabel: z.string().optional(),
  featured: z.boolean().default(false),
  postPurchaseNote: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type ProductInput = z.input<typeof ProductSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Variant = z.infer<typeof VariantSchema>;
