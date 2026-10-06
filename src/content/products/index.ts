import type { ProductInput } from '@/lib/catalog/schema';
import { beginnerKit } from './beginner-kit';
import { classicKit } from './classic-kit';
import { customPropeller } from './custom-propeller';
import { ellipticalKit } from './elliptical-kit';
import { propellerKit } from './propeller-kit';

export const rawProducts: ProductInput[] = [beginnerKit, classicKit, ellipticalKit, propellerKit, customPropeller];
