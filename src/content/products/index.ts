import type { ProductInput } from '@/lib/catalog/schema';
import { beginnerKit } from './beginner-kit';
import { classicEllipticalPackage } from './classic-elliptical-package';
import { classicKit } from './classic-kit';
import { customPropeller } from './custom-propeller';
import { ellipticalKit } from './elliptical-kit';
import { propellerKit } from './propeller-kit';

export const rawProducts: ProductInput[] = [
  beginnerKit,
  classicKit,
  ellipticalKit,
  classicEllipticalPackage,
  propellerKit,
  customPropeller,
];
