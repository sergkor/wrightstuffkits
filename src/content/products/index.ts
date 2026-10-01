import type { ProductInput } from '@/lib/catalog/schema';
import { advancedKit } from './advanced-kit';
import { beginnerKit } from './beginner-kit';
import { customPropeller } from './custom-propeller';
import { intermediateKit } from './intermediate-kit';
import { propellerKit } from './propeller-kit';

export const rawProducts: ProductInput[] = [beginnerKit, intermediateKit, advancedKit, propellerKit, customPropeller];
