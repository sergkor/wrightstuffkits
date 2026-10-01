# Wright Stuff Kits Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static Next.js store for wrightstuffkits.com on GitHub Pages with a persistent cart and client-side PayPal checkout, selling the 5 products in `inventory/kits.txt`.

**Architecture:** Next.js App Router with `output: 'export'`; catalog is typed TS data validated by Zod; cart is a Zustand store persisted to localStorage; PayPal Smart Buttons build the order from cart SKUs in the browser, with shipping options chosen inside the PayPal popup. One module (`src/lib/paypal/order.ts`) owns the order payload so a server-side verifier can replace it later.

**Tech Stack:** Next.js 16.3 (Turbopack), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), Lucide, Zustand 5, Zod 4, `@paypal/react-paypal-js` 10 (legacy v5 SDK API: `PayPalScriptProvider` + `PayPalButtons`), Vitest 5, Playwright 1.63, sharp (image prep script), GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-01-wrightstuffkits-store-design.md`

## Global Constraints

- Node 22 in CI (`actions/setup-node@v4`), npm as package manager (`npm ci` in CI).
- `next.config.mjs`: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`, no `basePath`.
- All money is integer cents; display via `formatCents`.
- Catalog categories are exactly `'kits' | 'propellers'`.
- SKUs match `/^[A-Z0-9-]+$/`; slugs match `/^[a-z0-9-]+$/`.
- localStorage key `wsk-cart-v1`; sessionStorage key `wsk-last-order`.
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is the only env var; missing value fails the build.
- US-only shipping (`site.usOnly = true`).
- Contact email placeholder `orders@wrightstuffkits.com` lives only in `src/content/site.ts`.
- `inventory/` is never imported by app code; it is the raw source for `scripts/prepare-images.mjs`.
- Tests must pass with `npm test -- --run` (Vitest, node environment, no jsdom).
- Every commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Scaffold Next.js with static export and prove `next build` emits `out/`

**Files:**
- Create (via CLI): `package.json`, `tsconfig.json`, `next.config.ts` (will be replaced by `next.config.mjs`), `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `next.config.mjs`, `public/CNAME`, `public/.nojekyll`, `.env.example`
- Modify: `.gitignore` (append), `README.md`

**Interfaces:**
- Produces: `npm run build` → `out/index.html`; `npm run lint` passes; `@/*` alias → `src/*`.

- [ ] **Step 1: Scaffold into the existing repo**

The repo already has `.git`, `LICENSE`, `README.md`, `inventory/`, `docs/`. create-next-app refuses a non-empty directory, so scaffold into a temp dir and move files in.

```bash
cd /Users/skorniychuk/dev/wrightstuffkits
npx create-next-app@latest ../wsk-scaffold --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git --no-agents-md --yes
rsync -a --exclude .git --exclude README.md --exclude .gitignore ../wsk-scaffold/ ./
cat ../wsk-scaffold/.gitignore >> .gitignore
rm -rf ../wsk-scaffold
```

- [ ] **Step 2: Replace the generated next config with the static-export config**

```bash
rm -f next.config.ts
```

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 3: Add GitHub Pages files and env example**

```bash
printf 'wrightstuffkits.com\n' > public/CNAME
touch public/.nojekyll
printf 'NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id\n' > .env.example
printf '\n# local env\n.env.local\n# next export output\nout/\n# playwright\ntest-results/\nplaywright-report/\n' >> .gitignore
```

Open `.gitignore` and make sure there is no bare `.env*` line that would hide `.env.example`; if there is, change it to `.env*.local`.

- [ ] **Step 4: Replace the placeholder home page and layout**

Overwrite `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold">Wright Stuff Kits</h1>
      <p className="mt-2 text-muted-foreground">Store coming soon.</p>
    </main>
  );
}
```

Overwrite `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wright Stuff Kits',
  description: 'Science Olympiad free-flight kits and propeller supplies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify lint script exists and build works**

Open `package.json`. Ensure scripts contain `"lint": "eslint ."` (Next 16 removed `next lint`; if the script is missing or says `next lint`, set it to `eslint .`). Then:

```bash
npm run lint
npm run build
ls out/index.html out/404.html public/CNAME
```

Expected: lint clean; build prints `○ /` as static; `out/index.html` exists.

- [ ] **Step 6: Update README**

Overwrite `README.md`:

````md
# Wright Stuff Kits

Static store for wrightstuffkits.com. Next.js static export, GitHub Pages, PayPal checkout.

## Develop

```bash
cp .env.example .env.local   # put your PayPal sandbox client ID in it
npm install
npm run dev
```

## Test and build

```bash
npm test -- --run     # unit tests
npm run build         # static export into out/
npm run e2e           # playwright smoke against out/
```

## Docs

- Design: `docs/superpowers/specs/2026-10-01-wrightstuffkits-store-design.md`
- PayPal account setup: `docs/PAYPAL_SETUP.md`
````

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js static export with GitHub Pages files

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: shadcn/ui, Lucide, and base theme

**Files:**
- Create (via CLI): `components.json`, `src/components/ui/{button,sheet,dialog,select,badge,input,separator,sonner}.tsx`, `src/lib/utils.ts`
- Modify: `src/app/globals.css` (CLI edits it), `src/app/layout.tsx`

**Interfaces:**
- Produces: `cn()` from `@/lib/utils`; shadcn components under `@/components/ui/*`; `<Toaster />` mounted in root layout; `toast` from `sonner`.

- [ ] **Step 1: Init shadcn with Radix**

```bash
npx shadcn@latest init -t next -b radix -y
```

If prompted for a base color choose `neutral`; accept other defaults. Confirm `components.json` has `"aliases": { "components": "@/components", "utils": "@/lib/utils" }` and that `src/app/globals.css` now contains `@import "tailwindcss";` and `@theme inline { ... }` blocks.

- [ ] **Step 2: Add components**

```bash
npx shadcn@latest add button sheet dialog select badge input separator sonner -y
npm install lucide-react
```

- [ ] **Step 3: Mount the toaster**

Modify `src/app/layout.tsx`:

```tsx
import { Toaster } from '@/components/ui/sonner';
// ...
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
```

- [ ] **Step 4: Verify build and lint**

```bash
npm run lint && npm run build
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add shadcn/ui components and Lucide icons

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Vitest and Playwright harness

**Files:**
- Create: `vitest.config.ts`, `src/test/harness.test.ts`, `playwright.config.ts`, `e2e/.gitkeep`
- Modify: `package.json` scripts

**Interfaces:**
- Produces: `npm test -- --run` runs `src/test/**/*.test.ts` in node env with `@/` alias; `npm run e2e` builds and serves `out/` on port 3000 for Playwright.

- [ ] **Step 1: Install**

```bash
npm install -D vitest @playwright/test serve
npx playwright install chromium
```

- [ ] **Step 2: Write a trivial failing test**

`src/test/harness.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('harness', () => {
  it('resolves the @/ alias', async () => {
    const mod = await import('@/lib/utils');
    expect(typeof mod.cn).toBe('function');
  });
});
```

- [ ] **Step 3: Run to see it fail (no config yet)**

Run: `npx vitest run`
Expected: FAIL, cannot resolve `@/lib/utils`.

- [ ] **Step 4: Add vitest config, playwright config, and scripts**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
});
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npx serve out -l 3000 --no-clipboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

Add to `package.json` scripts:

```json
"test": "vitest",
"e2e": "npm run build && playwright test"
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --run`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add Vitest and Playwright harness

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: GitHub Actions deploy workflow and PayPal setup guide

**Files:**
- Create: `.github/workflows/deploy.yml`, `docs/PAYPAL_SETUP.md`

**Interfaces:**
- Consumes: scripts `lint`, `test`, `build` from Tasks 1–3.
- Produces: deploy on push to `main`; PRs run lint/test/build only.

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
        env:
          NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${{ secrets.PAYPAL_CLIENT_ID }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write the PayPal setup guide**

`docs/PAYPAL_SETUP.md`:

```md
# PayPal setup for Wright Stuff Kits

This site has no server. The browser creates and captures PayPal orders using only a **Client ID**. You never need, and must never commit, a PayPal Secret.

## 1. Accounts

1. Create or upgrade to a PayPal **Business** account at paypal.com.
2. Sign in at https://developer.paypal.com with that account.

## 2. Sandbox (for testing)

1. Developer Dashboard → **Testing Tools → Sandbox Accounts**. You get a Business (seller) and a Personal (buyer) sandbox account. Use "..." → *View/Edit account* to set passwords.
2. **Apps & Credentials → Sandbox** tab → **Create App**. Name: `Wright Stuff Kits Sandbox`, type: Merchant. Copy the **Client ID**.
3. Locally, create `.env.local` containing `NEXT_PUBLIC_PAYPAL_CLIENT_ID=<sandbox client id>` and run `npm run dev`.
4. To test as a buyer, open https://sandbox.paypal.com and sign in with the Personal sandbox account.
5. To see orders as the seller, sign in to https://sandbox.paypal.com with the Business sandbox account → Activity.
6. **Negative testing** (declined cards): Sandbox app → *Features* → enable **Negative Testing**, then follow https://developer.paypal.com/tools/sandbox/negative-testing/ to trigger `INSTRUMENT_DECLINED`. The site's buttons restart on this error.

## 3. Live credentials

1. **Apps & Credentials → Live** tab → **Create App**. Name: `Wright Stuff Kits`. Copy the **Client ID**.
2. GitHub → repository **Settings → Secrets and variables → Actions → New repository secret**. Name `PAYPAL_CLIENT_ID`, value = live Client ID.
3. Re-run the "Deploy to GitHub Pages" workflow (Actions tab → Run workflow).

## 4. App features

In both apps keep only **Accept payments** enabled. Leave Vault, Log in with PayPal, and Subscriptions off.

## 5. Merchant account settings (paypal.com → Account Settings)

- **Shipping**: do **not** add shipping rules. The site passes its own shipping options in each order; PayPal rules would double-charge.
- **Sales tax**: if you must collect tax, set it here by state. The site does not compute tax.
- **Notifications**: keep "Payment received" emails on. These emails are your order record.
- **Business information**: set the display name and customer-service email that appear on receipts.
- **Currency**: USD primary.
- **Website payments → Website preferences**: Auto Return off, PDT off (not used).

## 6. Address rules

The site rejects non-US addresses inside the PayPal popup. No PayPal setting is required.

## 7. Verify every order before shipping

1. Open the transaction in PayPal → Activity.
2. Compare each item's SKU and unit price against `src/content/products/*.ts`.
3. Confirm the shipping method and address.
4. If anything differs from the catalog, refund and contact the buyer.

## 8. Refunds and disputes

Activity → transaction → **Refund** (full or partial). For Seller Protection, ship only to the address on the transaction and keep tracking numbers.

## 9. Rotating a Client ID

Create a new app, update the `PAYPAL_CLIENT_ID` secret, re-run the workflow, confirm checkout works, then delete the old app.

## Checklist before first live sale

- [ ] `contactEmail` and shipping rates set in `src/content/site.ts`
- [ ] Live Client ID in GitHub secret and deployed
- [ ] Custom domain and HTTPS enabled in GitHub Pages
- [ ] One real purchase of the cheapest item from a second PayPal account, then refunded
```

- [ ] **Step 3: Validate YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit and push; enable Pages**

```bash
git add -A
git commit -m "Add GitHub Pages deploy workflow and PayPal setup guide

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

Then, in the GitHub repo: Settings → Pages → Source: **GitHub Actions**. Add a repository secret `PAYPAL_CLIENT_ID` with the sandbox client ID for now (live later). Re-run the workflow if the first run failed before the secret existed. Expected: workflow green and the placeholder page served at `https://<user>.github.io/wrightstuffkits/` (custom domain comes in Task 17; until then the CNAME file is harmless).

---

### Task 5: Catalog schema and loader

**Files:**
- Create: `src/lib/catalog/schema.ts`, `src/lib/catalog/index.ts`, `src/content/products/index.ts`, `src/test/catalog-schema.test.ts`

**Interfaces:**
- Produces:
  - `Category = 'kits' | 'propellers'`, `Variant { sku; label; priceCents; inStock }`, `Product { slug; name; category; summary; description; images: {src; alt}[]; specs: Record<string,string>; included: string[]; notIncluded: string[]; downloads: {label; href}[]; variants: Variant[]; optionLabel?; featured; postPurchaseNote?; tags: string[] }`
  - `ProductInput = z.input<typeof ProductSchema>` (what content files export)
  - `buildCatalog(inputs: ProductInput[]): Product[]` — validates, asserts unique slug/SKU
  - `products: Product[]`, `getProduct(slug): Product | undefined`, `getVariant(sku): { product; variant } | undefined`, `filterProducts(products, { q?, category? }): Product[]`, `minPriceCents(product): number`, `CATEGORIES: { value: Category; label: string }[]`

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Write failing tests**

`src/test/catalog-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildCatalog, filterProducts, minPriceCents } from '@/lib/catalog';
import type { ProductInput } from '@/lib/catalog/schema';

const base: ProductInput = {
  slug: 'test-kit',
  name: 'Test Kit',
  category: 'kits',
  summary: 'A test kit',
  description: 'Long text',
  images: [{ src: '/images/products/test-kit/1.jpg', alt: 'Test kit' }],
  variants: [{ sku: 'TEST-KIT', label: 'Default', priceCents: 1000 }],
};

describe('buildCatalog', () => {
  it('applies defaults', () => {
    const [p] = buildCatalog([base]);
    expect(p.specs).toEqual({});
    expect(p.included).toEqual([]);
    expect(p.featured).toBe(false);
    expect(p.variants[0].inStock).toBe(true);
  });

  it('rejects duplicate slugs', () => {
    expect(() => buildCatalog([base, { ...base, variants: [{ sku: 'OTHER', label: 'x', priceCents: 1 }] }])).toThrow(/duplicate slug/i);
  });

  it('rejects duplicate SKUs across products', () => {
    expect(() => buildCatalog([base, { ...base, slug: 'other' }])).toThrow(/duplicate sku/i);
  });

  it('rejects bad slug and sku formats', () => {
    expect(() => buildCatalog([{ ...base, slug: 'Bad Slug' }])).toThrow();
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'bad sku', label: 'x', priceCents: 1 }] }]),
    ).toThrow();
  });

  it('rejects non-integer or non-positive prices', () => {
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'A', label: 'x', priceCents: 10.5 }] }]),
    ).toThrow();
    expect(() =>
      buildCatalog([{ ...base, variants: [{ sku: 'A', label: 'x', priceCents: 0 }] }]),
    ).toThrow();
  });
});

describe('filterProducts and minPriceCents', () => {
  const catalog = buildCatalog([
    base,
    {
      ...base,
      slug: 'prop',
      name: 'Propeller Kit',
      category: 'propellers',
      tags: ['balsa'],
      variants: [
        { sku: 'P-2', label: '2 sets', priceCents: 1299 },
        { sku: 'P-3', label: '3 sets', priceCents: 1699 },
      ],
    },
  ]);

  it('filters by category', () => {
    expect(filterProducts(catalog, { category: 'propellers' }).map((p) => p.slug)).toEqual(['prop']);
  });

  it('filters by query over name, summary, tags (case-insensitive)', () => {
    expect(filterProducts(catalog, { q: 'BALSA' }).map((p) => p.slug)).toEqual(['prop']);
    expect(filterProducts(catalog, { q: 'test' }).map((p) => p.slug)).toEqual(['test-kit']);
    expect(filterProducts(catalog, { q: '   ' })).toHaveLength(2);
  });

  it('returns the lowest variant price', () => {
    expect(minPriceCents(catalog[1])).toBe(1299);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- --run src/test/catalog-schema.test.ts`
Expected: FAIL, cannot find module `@/lib/catalog`.

- [ ] **Step 4: Implement schema**

`src/lib/catalog/schema.ts`:

```ts
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
```

- [ ] **Step 5: Implement loader**

`src/content/products/index.ts` (empty list for now; Task 6 fills it):

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const rawProducts: ProductInput[] = [];
```

`src/lib/catalog/index.ts`:

```ts
import { rawProducts } from '@/content/products';
import { CATEGORIES, ProductSchema, type Category, type Product, type ProductInput, type Variant } from './schema';

export { CATEGORIES };
export type { Category, Product, ProductInput, Variant };

export function buildCatalog(inputs: ProductInput[]): Product[] {
  const parsed = inputs.map((input, i) => {
    const result = ProductSchema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid product at index ${i} (${String(input.slug)}): ${result.error.message}`);
    }
    return result.data;
  });

  const slugs = new Set<string>();
  const skus = new Set<string>();
  for (const p of parsed) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
    for (const v of p.variants) {
      if (skus.has(v.sku)) throw new Error(`Duplicate SKU: ${v.sku} (product ${p.slug})`);
      skus.add(v.sku);
    }
  }
  return parsed;
}

export const products: Product[] = buildCatalog(rawProducts);

const bySlug = new Map(products.map((p) => [p.slug, p]));
const bySku = new Map<string, { product: Product; variant: Variant }>();
for (const product of products) for (const variant of product.variants) bySku.set(variant.sku, { product, variant });

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getVariant(sku: string): { product: Product; variant: Variant } | undefined {
  return bySku.get(sku);
}

export function minPriceCents(product: Product): number {
  return Math.min(...product.variants.map((v) => v.priceCents));
}

export function filterProducts(
  list: Product[],
  opts: { q?: string; category?: Category | '' },
): Product[] {
  const q = (opts.q ?? '').trim().toLowerCase();
  return list.filter((p) => {
    if (opts.category && p.category !== opts.category) return false;
    if (!q) return true;
    const hay = [p.name, p.summary, ...p.tags].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --run src/test/catalog-schema.test.ts`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Zod catalog schema and loader

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Product content and image preparation

**Files:**
- Create: `scripts/prepare-images.mjs`, `src/content/products/{advanced-kit,intermediate-kit,beginner-kit,propeller-kit,custom-propeller}.ts`, `public/images/products/**` (generated), `src/test/catalog-content.test.ts`
- Modify: `src/content/products/index.ts`, `package.json` (script)

**Interfaces:**
- Consumes: `ProductInput` from Task 5.
- Produces: `rawProducts` with 5 products; images at `/images/products/<slug>/<n>.jpg|png`.

- [ ] **Step 1: Write the failing content test**

`src/test/catalog-content.test.ts`:

```ts
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { products, getVariant } from '@/lib/catalog';

const PUBLIC = path.resolve(__dirname, '../../public');

describe('catalog content', () => {
  it('has the five launch products', () => {
    expect(products.map((p) => p.slug).sort()).toEqual([
      'advanced-kit',
      'beginner-kit',
      'custom-propeller',
      'intermediate-kit',
      'propeller-kit',
    ]);
  });

  it('prices match inventory/kits.txt', () => {
    expect(getVariant('ADV-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('INT-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('BEG-KIT')?.variant.priceCents).toBe(4999);
    expect(getVariant('PROP-KIT')?.variant.priceCents).toBe(699);
    expect(getVariant('CPROP-2')?.variant.priceCents).toBe(1299);
    expect(getVariant('CPROP-6')?.variant.priceCents).toBe(2899);
  });

  it('custom propeller has 5 set-count variants stepping by $4', () => {
    const p = products.find((x) => x.slug === 'custom-propeller')!;
    expect(p.variants.map((v) => v.priceCents)).toEqual([1299, 1699, 2099, 2499, 2899]);
    expect(p.optionLabel).toBe('Number of sets');
    expect(p.postPurchaseNote).toContain('{contactEmail}');
  });

  it('every image and download path exists under public/', () => {
    for (const p of products) {
      for (const img of p.images) expect(existsSync(path.join(PUBLIC, img.src)), img.src).toBe(true);
      for (const d of p.downloads) expect(existsSync(path.join(PUBLIC, d.href)), d.href).toBe(true);
    }
  });

  it('three kits are featured', () => {
    expect(products.filter((p) => p.featured).map((p) => p.slug).sort()).toEqual([
      'advanced-kit',
      'beginner-kit',
      'intermediate-kit',
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/test/catalog-content.test.ts`
Expected: FAIL on "has the five launch products" (empty catalog).

- [ ] **Step 3: Image prep script**

```bash
npm install -D sharp
```

`scripts/prepare-images.mjs`:

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'inventory';
const OUT = 'public/images/products';
const MAX = 1600;

// [source file, slug, output basename, kind]
const MAP = [
  ['advanced.PNG', 'advanced-kit', 'render', 'png'],
  ['IMG_1511.JPG', 'advanced-kit', '1', 'jpg'],
  ['IMG_1512.JPG', 'advanced-kit', '2', 'jpg'],
  ['IMG_1513.JPG', 'advanced-kit', '3', 'jpg'],
  ['IMG_1514.JPG', 'advanced-kit', '4', 'jpg'],
  ['Intermediate_Kit_2026-Oct-01_06-19-39AM-000_CustomizedView25131942226.png', 'intermediate-kit', 'render', 'png'],
  ['IMG_1506.JPG', 'intermediate-kit', '1', 'jpg'],
  ['IMG_1508.JPG', 'intermediate-kit', '2', 'jpg'],
  ['IMG_1509.JPG', 'intermediate-kit', '3', 'jpg'],
  ['beginner.PNG', 'beginner-kit', 'render', 'png'],
  ['IMG_1521.JPG', 'beginner-kit', '1', 'jpg'],
  ['IMG_1524.JPG', 'beginner-kit', '2', 'jpg'],
  ['IMG_1538.JPG', 'propeller-kit', '1', 'jpg'],
  ['IMG_1538.JPG', 'custom-propeller', '1', 'jpg'],
];

for (const [file, slug, base, kind] of MAP) {
  const dir = path.join(OUT, slug);
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `${base}.${kind}`);
  let img = sharp(path.join(SRC, file))
    .rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  img = kind === 'png' ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 82, mozjpeg: true });
  const info = await img.toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
```

Add script to `package.json`: `"images": "node scripts/prepare-images.mjs"`. Run `npm run images`. Expected: 14 files written, each under ~400 KB (if a PNG exceeds that, change its `kind` to `jpg` in MAP, update the matching `images[].src` below, and re-run).

- [ ] **Step 4: Product files**

`src/content/products/advanced-kit.ts`:

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const advancedKit: ProductInput = {
  slug: 'advanced-kit',
  name: 'Advanced Kit',
  category: 'kits',
  featured: true,
  summary: 'Max-duration Division C 2027 flyer. Builds 2 planes. Designed for 3+ minute flights.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed for maximum possible flight time (designed for 3+ minutes). Each kit has enough to build 2 planes.

Built around laser-cut balsa and plywood parts, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs to tune blade pitch.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
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
```

`src/content/products/intermediate-kit.ts`:

```ts
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
```

`src/content/products/beginner-kit.ts`:

```ts
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
  specs: {
    'Rules compliance': 'Science Olympiad Division C 2027',
    'Planes per kit': '2',
    Covering: 'Tissue',
    Structure: 'Laser-cut balsa and plywood',
    Propeller: 'Ikara 24 cm (1 included)',
    'Approx. weight': '9.5 g',
  },
  included: [
    'Laser-cut balsa and plywood parts',
    'Tissue covering',
    'Ikara 24 cm propeller',
    '1/8" FAI rubber',
    'O-rings',
    'Step-by-step instructions (assembly, motor making, winding, trimming)',
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'BEG-KIT', label: 'Default', priceCents: 4999 }],
  tags: ['science olympiad', 'division c', 'tissue', 'beginner', 'ikara'],
};
```

`src/content/products/propeller-kit.ts`:

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const propellerKit: ProductInput = {
  slug: 'propeller-kit',
  name: 'Propeller Kit',
  category: 'propellers',
  summary: 'Materials and jig to build 2 balsa propellers with adjustable-pitch hubs.',
  description: `Includes materials and a jig to build 2 balsa wood propellers for Science Olympiad models using 1/32" balsa. Optimized design made for maximum flight time. Includes a hub with an adjustable pitch angle.`,
  images: [{ src: '/images/products/propeller-kit/1.jpg', alt: 'Finished balsa propeller with adjustable hub' }],
  specs: { 'Props per kit': '2', Material: '1/32" balsa', Hub: 'Adjustable pitch' },
  included: ['1/32" balsa blade blanks for 2 propellers', 'Forming jig', 'Adjustable-pitch hub'],
  notIncluded: ['Super glue (CA)', 'Hobby knife'],
  variants: [{ sku: 'PROP-KIT', label: 'Default', priceCents: 699 }],
  tags: ['propeller', 'balsa', 'hub'],
};
```

`src/content/products/custom-propeller.ts`:

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const customPropeller: ProductInput = {
  slug: 'custom-propeller',
  name: 'Custom Laser-cut Propeller',
  category: 'propellers',
  summary: 'Your propeller design laser-cut from 1/32" balsa, with hubs and forming tube.',
  description: `We laser-cut your propeller design from 1/32" balsa. Two sets for $12.99, plus $4 for each additional set (including multiple different designs).

Comes with adjustable propeller hubs, a 4 x 2 inch cardboard tube for wet-forming the balsa, and everything else needed to complete the propeller.

After ordering, email your design in any format (DXF preferred; an image works if you also give a size).`,
  images: [{ src: '/images/products/custom-propeller/1.jpg', alt: 'Laser-cut balsa propeller example' }],
  specs: { Material: '1/32" balsa', Hub: 'Adjustable pitch', 'Forming tube': '4 x 2 inch cardboard' },
  included: ['Laser-cut blades for each set', 'Adjustable propeller hubs', 'Cardboard forming tube'],
  notIncluded: ['Super glue (CA)'],
  optionLabel: 'Number of sets',
  variants: [
    { sku: 'CPROP-2', label: '2 sets', priceCents: 1299 },
    { sku: 'CPROP-3', label: '3 sets', priceCents: 1699 },
    { sku: 'CPROP-4', label: '4 sets', priceCents: 2099 },
    { sku: 'CPROP-5', label: '5 sets', priceCents: 2499 },
    { sku: 'CPROP-6', label: '6 sets', priceCents: 2899 },
  ],
  postPurchaseNote:
    'Email your propeller design (DXF preferred, or any image plus a size) and your PayPal order ID to {contactEmail}.',
  tags: ['propeller', 'custom', 'laser', 'balsa'],
};
```

Replace `src/content/products/index.ts`:

```ts
import type { ProductInput } from '@/lib/catalog/schema';
import { advancedKit } from './advanced-kit';
import { beginnerKit } from './beginner-kit';
import { customPropeller } from './custom-propeller';
import { intermediateKit } from './intermediate-kit';
import { propellerKit } from './propeller-kit';

export const rawProducts: ProductInput[] = [beginnerKit, intermediateKit, advancedKit, propellerKit, customPropeller];
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --run`
Expected: all pass, including image existence.

- [ ] **Step 6: Commit (including generated images)**

```bash
git add -A
git commit -m "Add launch catalog content and prepared product images

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Site config and formatting helpers

**Files:**
- Create: `src/content/site.ts`, `src/lib/format.ts`, `src/lib/env.ts`, `src/test/format.test.ts`, `src/test/env.test.ts`

**Interfaces:**
- Produces:
  - `formatCents(cents: number): string` → `'$75.99'`
  - `fillTemplate(text: string, vars: Record<string,string>): string` replaces `{key}`
  - `requireEnv(name: string, value: string | undefined): string` throws `Missing required env var NAME`
  - `site = { name, domain, url, tagline, contactEmail, usOnly, shippingOptions: ShippingOption[], paypalClientId }` with `ShippingOption { id; label; amountCents; selected }`
  - `defaultShippingOption(): ShippingOption`, `getShippingOption(id): ShippingOption | undefined`

- [ ] **Step 1: Failing tests**

`src/test/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fillTemplate, formatCents } from '@/lib/format';

describe('formatCents', () => {
  it('formats whole and fractional dollars', () => {
    expect(formatCents(7599)).toBe('$75.99');
    expect(formatCents(699)).toBe('$6.99');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(100000)).toBe('$1,000.00');
  });
});

describe('fillTemplate', () => {
  it('replaces {key} placeholders', () => {
    expect(fillTemplate('mail {contactEmail} now', { contactEmail: 'a@b.c' })).toBe('mail a@b.c now');
  });
  it('leaves unknown keys alone', () => {
    expect(fillTemplate('{x}', {})).toBe('{x}');
  });
});
```

`src/test/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { requireEnv } from '@/lib/env';

describe('requireEnv', () => {
  it('returns the trimmed value when present', () => {
    expect(requireEnv('X', ' abc ')).toBe('abc');
  });
  it('throws when missing or blank', () => {
    expect(() => requireEnv('X', undefined)).toThrow('Missing required env var X');
    expect(() => requireEnv('X', '  ')).toThrow('Missing required env var X');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/test/format.test.ts src/test/env.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`src/lib/format.ts`:

```ts
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? vars[key] : match));
}
```

`src/lib/env.ts`:

```ts
export function requireEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) throw new Error(`Missing required env var ${name}`);
  return value.trim();
}
```

`src/content/site.ts`:

```ts
import { requireEnv } from '@/lib/env';

export interface ShippingOption {
  id: string;
  label: string;
  amountCents: number;
  selected: boolean;
}

export const site = {
  name: 'Wright Stuff Kits',
  domain: 'wrightstuffkits.com',
  url: 'https://wrightstuffkits.com',
  tagline: 'Science Olympiad free-flight kits and propeller supplies',
  // Placeholder. Replace before launch (see docs/PAYPAL_SETUP.md checklist).
  contactEmail: 'orders@wrightstuffkits.com',
  usOnly: true,
  shippingOptions: [
    { id: 'usps-ground', label: 'USPS Ground Advantage', amountCents: 650, selected: true },
    { id: 'usps-priority', label: 'USPS Priority Mail', amountCents: 1050, selected: false },
  ] as ShippingOption[],
  // Inlined at build time by Next.js; the build fails if unset.
  paypalClientId: requireEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
};

export function defaultShippingOption(): ShippingOption {
  return site.shippingOptions.find((o) => o.selected) ?? site.shippingOptions[0];
}

export function getShippingOption(id: string): ShippingOption | undefined {
  return site.shippingOptions.find((o) => o.id === id);
}
```

Create `.env.local` locally. Use a real sandbox client ID if you have one; otherwise the literal `sb`, which loads the PayPal SDK in a demo sandbox mode and is enough for builds and smoke tests:

```bash
printf 'NEXT_PUBLIC_PAYPAL_CLIENT_ID=sb\n' > .env.local
```

Vitest does not load `.env.local`, and `site.ts` will be imported by tests from Task 14 onward, so add to `vitest.config.ts` inside `test`: `env: { NEXT_PUBLIC_PAYPAL_CLIENT_ID: 'test-client-id' },`.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run && npm run build`
Expected: pass; build succeeds. (`site.ts` is not yet imported by any page, so the build-time env guard is exercised in Task 9.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add site config, env guard, and formatting helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Cart pricing, resolution, and persisted store

**Files:**
- Create: `src/lib/cart/pricing.ts`, `src/lib/cart/resolve.ts`, `src/lib/cart/store.ts`, `src/lib/cart/hooks.ts`, `src/test/pricing.test.ts`, `src/test/cart-store.test.ts`

**Interfaces:**
- Consumes: `getVariant`, `Product`, `Variant` (Task 5).
- Produces:
  - `CartItem { sku: string; qty: number }`
  - `CartLine { sku; qty; product: Product; variant: Variant; lineTotalCents: number }`
  - `lineTotalCents(priceCents, qty)`, `subtotalCents(lines: CartLine[])`, `itemCount(items: CartItem[])`
  - `resolveLines(items: CartItem[]): CartLine[]` (drops unknown SKUs)
  - `createCartStore(storage?: StateStorage)` returning a vanilla Zustand store with `.persist.rehydrate()`; `cartStore` singleton; `useCart(selector)` hook
  - State `{ items, isOpen, hasHydrated, add, setQty, remove, clear, open, close, setHydrated, prune }`
  - `useCartHydration()`, `useCartLines(): CartLine[]`, `useCartCount(): number`

- [ ] **Step 1: Install zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Failing tests**

`src/test/pricing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { itemCount, lineTotalCents, subtotalCents } from '@/lib/cart/pricing';
import { resolveLines } from '@/lib/cart/resolve';

describe('pricing', () => {
  it('multiplies in integer cents', () => {
    expect(lineTotalCents(1299, 3)).toBe(3897);
    expect(lineTotalCents(699, 0)).toBe(0);
  });

  it('sums line totals', () => {
    const lines = resolveLines([
      { sku: 'ADV-KIT', qty: 1 },
      { sku: 'PROP-KIT', qty: 2 },
    ]);
    expect(subtotalCents(lines)).toBe(7599 + 1398);
    expect(subtotalCents([])).toBe(0);
  });

  it('counts items', () => {
    expect(itemCount([{ sku: 'A', qty: 2 }, { sku: 'B', qty: 3 }])).toBe(5);
  });
});

describe('resolveLines', () => {
  it('joins catalog data and drops unknown SKUs', () => {
    const lines = resolveLines([
      { sku: 'CPROP-3', qty: 1 },
      { sku: 'NOPE', qty: 4 },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].product.slug).toBe('custom-propeller');
    expect(lines[0].variant.label).toBe('3 sets');
    expect(lines[0].lineTotalCents).toBe(1699);
  });
});
```

`src/test/cart-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createCartStore } from '@/lib/cart/store';

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('cart store', () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it('adds and merges quantities', () => {
    const store = createCartStore(storage);
    store.getState().add('ADV-KIT');
    store.getState().add('ADV-KIT', 2);
    expect(store.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 3 }]);
  });

  it('setQty updates and removes at zero', () => {
    const store = createCartStore(storage);
    store.getState().add('PROP-KIT', 2);
    store.getState().setQty('PROP-KIT', 5);
    expect(store.getState().items[0].qty).toBe(5);
    store.getState().setQty('PROP-KIT', 0);
    expect(store.getState().items).toEqual([]);
  });

  it('remove and clear', () => {
    const store = createCartStore(storage);
    store.getState().add('A');
    store.getState().add('B');
    store.getState().remove('A');
    expect(store.getState().items.map((i) => i.sku)).toEqual(['B']);
    store.getState().clear();
    expect(store.getState().items).toEqual([]);
  });

  it('open/close drawer', () => {
    const store = createCartStore(storage);
    expect(store.getState().isOpen).toBe(false);
    store.getState().open();
    expect(store.getState().isOpen).toBe(true);
    store.getState().close();
    expect(store.getState().isOpen).toBe(false);
  });

  it('persists only items and rehydrates on demand', async () => {
    const a = createCartStore(storage);
    a.getState().add('ADV-KIT', 2);
    a.getState().open();
    expect(storage.data.get('wsk-cart-v1')).toContain('ADV-KIT');
    expect(storage.data.get('wsk-cart-v1')).not.toContain('isOpen');

    const b = createCartStore(storage);
    expect(b.getState().hasHydrated).toBe(false);
    expect(b.getState().items).toEqual([]);
    await b.persist.rehydrate();
    expect(b.getState().hasHydrated).toBe(true);
    expect(b.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 2 }]);
  });

  it('prunes unknown SKUs on rehydrate', async () => {
    storage.setItem(
      'wsk-cart-v1',
      JSON.stringify({ state: { items: [{ sku: 'ADV-KIT', qty: 1 }, { sku: 'GONE', qty: 9 }] }, version: 0 }),
    );
    const store = createCartStore(storage);
    await store.persist.rehydrate();
    expect(store.getState().items).toEqual([{ sku: 'ADV-KIT', qty: 1 }]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- --run src/test/pricing.test.ts src/test/cart-store.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement pricing and resolve**

`src/lib/cart/pricing.ts`:

```ts
import type { CartItem, CartLine } from './resolve';

export function lineTotalCents(priceCents: number, qty: number): number {
  return priceCents * qty;
}

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
}

export function itemCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
```

`src/lib/cart/resolve.ts`:

```ts
import { getVariant, type Product, type Variant } from '@/lib/catalog';
import { lineTotalCents } from './pricing';

export interface CartItem {
  sku: string;
  qty: number;
}

export interface CartLine extends CartItem {
  product: Product;
  variant: Variant;
  lineTotalCents: number;
}

export function resolveLines(items: CartItem[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of items) {
    const hit = getVariant(item.sku);
    if (!hit) continue;
    lines.push({
      ...item,
      product: hit.product,
      variant: hit.variant,
      lineTotalCents: lineTotalCents(hit.variant.priceCents, item.qty),
    });
  }
  return lines;
}
```

- [ ] **Step 5: Implement store and hooks**

`src/lib/cart/store.ts`:

```ts
import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { getVariant } from '@/lib/catalog';
import type { CartItem } from './resolve';

export const CART_STORAGE_KEY = 'wsk-cart-v1';

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  add: (sku: string, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setHydrated: () => void;
  prune: () => void;
}

const browserStorage: StateStorage = {
  getItem: (k) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: (k, v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

export function createCartStore(storage: StateStorage = browserStorage) {
  return createStore<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        hasHydrated: false,
        add: (sku, qty = 1) =>
          set((s) => {
            const existing = s.items.find((i) => i.sku === sku);
            const items = existing
              ? s.items.map((i) => (i.sku === sku ? { ...i, qty: i.qty + qty } : i))
              : [...s.items, { sku, qty }];
            return { items };
          }),
        setQty: (sku, qty) =>
          set((s) => ({
            items:
              qty <= 0
                ? s.items.filter((i) => i.sku !== sku)
                : s.items.map((i) => (i.sku === sku ? { ...i, qty } : i)),
          })),
        remove: (sku) => set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),
        clear: () => set({ items: [] }),
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        setHydrated: () => set({ hasHydrated: true }),
        prune: () => set({ items: get().items.filter((i) => getVariant(i.sku) !== undefined) }),
      }),
      {
        name: CART_STORAGE_KEY,
        storage: createJSONStorage(() => storage),
        partialize: (s) => ({ items: s.items }),
        skipHydration: true,
        onRehydrateStorage: () => (state) => {
          state?.prune();
          state?.setHydrated();
        },
      },
    ),
  );
}

export const cartStore = createCartStore();

export function useCart<T>(selector: (s: CartState) => T): T {
  return useStore(cartStore, selector);
}
```

`src/lib/cart/hooks.ts`:

```ts
'use client';
import { useEffect, useMemo } from 'react';
import { itemCount } from './pricing';
import { resolveLines, type CartLine } from './resolve';
import { cartStore, useCart } from './store';

/** Mount once (root layout). Rehydrates the persisted cart after first paint so SSG HTML matches. */
export function useCartHydration(): void {
  useEffect(() => {
    void cartStore.persist.rehydrate();
  }, []);
}

export function useCartLines(): CartLine[] {
  const items = useCart((s) => s.items);
  return useMemo(() => resolveLines(items), [items]);
}

export function useCartCount(): number {
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hasHydrated);
  return hydrated ? itemCount(items) : 0;
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --run`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add cart pricing, resolution, and persisted Zustand store

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Layout shell: header, footer, cart trigger, hydration

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/CartTrigger.tsx`, `src/components/layout/MobileNav.tsx`, `src/components/cart/CartHydration.tsx`, `public/images/brand/logo.svg`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useCartCount`, `useCart`, `useCartHydration` (Task 8), `site` (Task 7).
- Produces: `NAV_LINKS` in `Header.tsx`; `CartTrigger` opens the drawer (drawer itself arrives in Task 13).

- [ ] **Step 1: Logo**

`public/images/brand/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
  <path d="M4 34 L60 20 L58 26 L30 36 Z" fill="currentColor"/>
  <path d="M30 36 L24 52 L20 50 L26 36 Z" fill="currentColor"/>
  <circle cx="58" cy="23" r="3" fill="currentColor"/>
</svg>
```

- [ ] **Step 2: Components**

`src/components/layout/CartTrigger.tsx`:

```tsx
'use client';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartCount } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';

export function CartTrigger() {
  const count = useCartCount();
  const open = useCart((s) => s.open);
  return (
    <Button variant="ghost" size="icon" aria-label={`Open cart, ${count} items`} onClick={open} data-testid="cart-trigger">
      <span className="relative">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span
            data-testid="cart-count"
            className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
          >
            {count}
          </span>
        )}
      </span>
    </Button>
  );
}
```

`src/components/layout/MobileNav.tsx`:

```tsx
'use client';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-3 px-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-lg" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

`src/components/layout/Header.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/content/site';
import { CartTrigger } from './CartTrigger';
import { MobileNav } from './MobileNav';

export const NAV_LINKS = [
  { href: '/products/', label: 'Shop' },
  { href: '/products/?cat=kits', label: 'Kits' },
  { href: '/products/?cat=propellers', label: 'Propellers' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <MobileNav links={NAV_LINKS} />
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/images/brand/logo.svg" alt="" width={28} height={28} />
          <span>{site.name}</span>
        </Link>
        <nav className="ml-6 hidden gap-5 text-sm md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <CartTrigger />
        </div>
      </div>
    </header>
  );
}
```

`src/components/layout/Footer.tsx`:

```tsx
import Link from 'next/link';
import { site } from '@/content/site';

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <nav className="flex gap-4">
          <Link href="/faq/">Shipping &amp; returns</Link>
          <Link href="/contact/">Contact</Link>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </nav>
      </div>
    </footer>
  );
}
```

`src/components/cart/CartHydration.tsx`:

```tsx
'use client';
import { useCartHydration } from '@/lib/cart/hooks';

export function CartHydration() {
  useCartHydration();
  return null;
}
```

- [ ] **Step 3: Root layout**

Overwrite `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { CartHydration } from '@/components/cart/CartHydration';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { site } from '@/content/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
  openGraph: { siteName: site.name, type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <CartHydration />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build, env guard, and dev render**

```bash
npm run lint && npm run build
mv .env.local .env.local.bak; npm run build; echo "exit=$?"; mv .env.local.bak .env.local
```

Expected: first build succeeds; second build fails with `Missing required env var NEXT_PUBLIC_PAYPAL_CLIENT_ID` (exit≠0). Then `npm run dev`, open http://localhost:3000, confirm header, footer, and cart icon with no hydration warnings in the console.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add layout shell with header, footer, and cart trigger

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Catalog page with search and category filter

**Files:**
- Create: `src/components/catalog/ProductCard.tsx`, `src/components/catalog/ProductGrid.tsx`, `src/components/catalog/CategoryFilter.tsx`, `src/components/catalog/SearchBox.tsx`, `src/components/catalog/CatalogView.tsx`, `src/app/products/page.tsx`

**Interfaces:**
- Consumes: `products`, `filterProducts`, `CATEGORIES`, `minPriceCents` (Task 5), `formatCents` (Task 7).
- Produces: `ProductCard({ product })`, `ProductGrid({ products })` reused by the home page (Task 11).

- [ ] **Step 1: Components**

`src/components/catalog/ProductCard.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { minPriceCents, type Product } from '@/lib/catalog';
import { formatCents } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.variants.every((v) => !v.inStock);
  const multi = product.variants.length > 1;
  return (
    <Link
      href={`/products/${product.slug}/`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
      data-testid="product-card"
    >
      <div className="relative aspect-[4/3] bg-muted">
        <Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        {soldOut && <Badge variant="secondary" className="absolute left-2 top-2">Sold out</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold group-hover:underline">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.summary}</p>
        <p className="mt-auto pt-2 font-medium">
          {multi ? 'From ' : ''}
          {formatCents(minPriceCents(product))}
        </p>
      </div>
    </Link>
  );
}
```

`src/components/catalog/ProductGrid.tsx`:

```tsx
import type { Product } from '@/lib/catalog';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return <p className="py-12 text-center text-muted-foreground">No products match.</p>;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-grid">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
```

`src/components/catalog/CategoryFilter.tsx`:

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { CATEGORIES, type Category } from '@/lib/catalog';

export function CategoryFilter({ value, onChange }: { value: Category | ''; onChange: (c: Category | '') => void }) {
  const all: { value: Category | ''; label: string }[] = [{ value: '', label: 'All' }, ...CATEGORIES];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {all.map((c) => (
        <Button
          key={c.value || 'all'}
          size="sm"
          variant={value === c.value ? 'default' : 'outline'}
          onClick={() => onChange(c.value)}
          aria-pressed={value === c.value}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );
}
```

`src/components/catalog/SearchBox.tsx`:

```tsx
'use client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBox({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
        aria-label="Search products"
        data-testid="search"
      />
    </div>
  );
}
```

`src/components/catalog/CatalogView.tsx`:

```tsx
'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { filterProducts, products, type Category } from '@/lib/catalog';
import { CategorySchema } from '@/lib/catalog/schema';
import { CategoryFilter } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import { SearchBox } from './SearchBox';

export function CatalogView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = params.get('q') ?? '';
  const catParam = params.get('cat') ?? '';
  const category: Category | '' = CategorySchema.safeParse(catParam).success ? (catParam as Category) : '';

  const update = useCallback(
    (next: { q?: string; cat?: string }) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const visible = useMemo(() => filterProducts(products, { q, category }), [q, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter value={category} onChange={(c) => update({ cat: c })} />
        <SearchBox value={q} onChange={(v) => update({ q: v })} />
      </div>
      <ProductGrid products={visible} />
    </div>
  );
}
```

`src/app/products/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = { title: 'Shop', description: 'All kits and propeller supplies.' };

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Shop</h1>
      <Suspense fallback={null}>
        <CatalogView />
      </Suspense>
    </main>
  );
}
```

`useSearchParams` requires the `Suspense` boundary in a static export; without it `next build` errors with "useSearchParams() should be wrapped in a suspense boundary".

- [ ] **Step 2: Verify**

```bash
npm run lint && npm run build
```

Then `npm run dev` → http://localhost:3000/products/?cat=propellers shows 2 products; typing "mylar" in search narrows to Advanced and Intermediate and the URL updates to `?q=mylar`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add catalog page with search and category filter

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Home page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ProductGrid` (Task 10), `products` (Task 5), `site` (Task 7).

- [ ] **Step 1: Write the page**

Overwrite `src/app/page.tsx`:

```tsx
import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export default function HomePage() {
  const featured = products.filter((p) => p.featured);
  const propellers = products.filter((p) => p.category === 'propellers');
  const compare = featured.map((p) => ({
    name: p.name,
    slug: p.slug,
    covering: p.specs.Covering ?? '—',
    propeller: p.specs.Propeller ?? '—',
    weight: p.specs['Approx. weight'] ?? 'Minimum legal',
    flight: p.specs['Target flight time'] ?? 'Competitive',
  }));

  return (
    <main>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Science Olympiad Division C 2027</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">Rubber-powered flyer kits built to win.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {site.tagline}. Laser-cut parts, Mylar or tissue covering, and instructions that cover building, winding, and trimming.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link href="/products/?cat=kits">Shop kits</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/products/?cat=propellers">Propellers</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Featured kits</h2>
        <ProductGrid products={featured} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-4 text-2xl font-semibold">Which kit?</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Kit</th><th className="p-3">Covering</th><th className="p-3">Propeller</th><th className="p-3">Weight</th><th className="p-3">Flight</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((r) => (
                <tr key={r.slug} className="border-t">
                  <td className="p-3 font-medium"><Link href={`/products/${r.slug}/`} className="underline-offset-2 hover:underline">{r.name}</Link></td>
                  <td className="p-3">{r.covering}</td><td className="p-3">{r.propeller}</td><td className="p-3">{r.weight}</td><td className="p-3">{r.flight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Propellers</h2>
        <ProductGrid products={propellers} />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run lint && npm run build
git add -A
git commit -m "Add home page with featured kits and comparison

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Product detail page

**Files:**
- Create: `src/components/product/Gallery.tsx`, `src/components/product/SpecTable.tsx`, `src/components/product/IncludedList.tsx`, `src/components/product/Downloads.tsx`, `src/components/product/Description.tsx`, `src/components/product/VariantSelector.tsx`, `src/components/product/PurchasePanel.tsx`, `src/app/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProduct`, `products`, `minPriceCents` (Task 5), `useCart` (Task 8), `formatCents` (Task 7), `site` (Task 7).
- Produces: `PurchasePanel({ product })` with Add to Cart and Buy Now; Buy Now routes to `/checkout/` (page arrives in Task 14).

- [ ] **Step 1: Presentational components**

`src/components/product/Gallery.tsx`:

```tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
        <Image key={current.src} src={current.src} alt={current.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-current={idx === i}
              className={cn('relative size-16 shrink-0 overflow-hidden rounded border', idx === i && 'ring-2 ring-primary')}
            >
              <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

`src/components/product/SpecTable.tsx`:

```tsx
export function SpecTable({ specs }: { specs: Record<string, string> }) {
  const rows = Object.entries(specs);
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
      <dl className="divide-y rounded-lg border text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[1fr_2fr] gap-3 p-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

`src/components/product/IncludedList.tsx`:

```tsx
import { Check, X } from 'lucide-react';

export function IncludedList({ included, notIncluded }: { included: string[]; notIncluded: string[] }) {
  if (included.length === 0 && notIncluded.length === 0) return null;
  return (
    <section className="grid gap-6 md:grid-cols-2">
      {included.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">In the box</h2>
          <ul className="space-y-1 text-sm">
            {included.map((s) => (
              <li key={s} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-green-600" />{s}</li>
            ))}
          </ul>
        </div>
      )}
      {notIncluded.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">You will need</h2>
          <ul className="space-y-1 text-sm">
            {notIncluded.map((s) => (
              <li key={s} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

`src/components/product/Downloads.tsx`:

```tsx
import { FileDown } from 'lucide-react';

export function Downloads({ downloads }: { downloads: { label: string; href: string }[] }) {
  if (downloads.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Manuals and guides</h2>
      <ul className="space-y-2 text-sm">
        {downloads.map((d) => (
          <li key={d.href}>
            <a href={d.href} download className="inline-flex items-center gap-2 underline-offset-2 hover:underline">
              <FileDown className="size-4" />{d.label} (PDF)
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`src/components/product/Description.tsx`:

```tsx
export function Description({ text }: { text: string }) {
  return (
    <section className="space-y-3 text-base leading-relaxed">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>{para.trim()}</p>
      ))}
    </section>
  );
}
```

`src/components/product/VariantSelector.tsx`:

```tsx
'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Variant } from '@/lib/catalog';
import { formatCents } from '@/lib/format';

export function VariantSelector({
  label,
  variants,
  value,
  onChange,
}: {
  label: string;
  variants: Variant[];
  value: string;
  onChange: (sku: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="variant">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="variant" className="w-full" data-testid="variant-select"><SelectValue /></SelectTrigger>
        <SelectContent>
          {variants.map((v) => (
            <SelectItem key={v.sku} value={v.sku} disabled={!v.inStock}>
              {v.label} — {formatCents(v.priceCents)}{v.inStock ? '' : ' (sold out)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Purchase panel**

`src/components/product/PurchasePanel.tsx`:

```tsx
'use client';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart/store';
import { formatCents } from '@/lib/format';
import { VariantSelector } from './VariantSelector';

export function PurchasePanel({ product }: { product: Product }) {
  const firstInStock = product.variants.find((v) => v.inStock) ?? product.variants[0];
  const [sku, setSku] = useState(firstInStock.sku);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const clear = useCart((s) => s.clear);
  const router = useRouter();

  const variant = product.variants.find((v) => v.sku === sku) ?? firstInStock;
  const soldOut = !variant.inStock;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold" data-testid="price">{formatCents(variant.priceCents)}</span>
        {soldOut && <Badge variant="secondary">Sold out</Badge>}
      </div>

      {product.variants.length > 1 && (
        <VariantSelector label={product.optionLabel ?? 'Option'} variants={product.variants} value={sku} onChange={setSku} />
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Qty</span>
        <Button type="button" variant="outline" size="icon" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center" data-testid="qty">{qty}</span>
        <Button type="button" variant="outline" size="icon" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={soldOut}
          data-testid="add-to-cart"
          onClick={() => {
            add(variant.sku, qty);
            open();
          }}
        >
          Add to cart
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={soldOut}
          data-testid="buy-now"
          onClick={() => {
            clear();
            add(variant.sku, qty);
            router.push('/checkout/');
          }}
        >
          Buy now with PayPal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Shipping options and any tax are chosen in PayPal. US addresses only.</p>
    </div>
  );
}
```

- [ ] **Step 3: Page**

`src/app/products/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Description } from '@/components/product/Description';
import { Downloads } from '@/components/product/Downloads';
import { Gallery } from '@/components/product/Gallery';
import { IncludedList } from '@/components/product/IncludedList';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { SpecTable } from '@/components/product/SpecTable';
import { site } from '@/content/site';
import { getProduct, minPriceCents, products } from '@/lib/catalog';

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    openGraph: { title: p.name, description: p.summary, images: [{ url: p.images[0].src }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary,
    image: product.images.map((i) => `${site.url}${i.src}`),
    sku: product.variants[0].sku,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: (minPriceCents(product) / 100).toFixed(2),
      highPrice: (Math.max(...product.variants.map((v) => v.priceCents)) / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.inStock) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery images={product.images} />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">{product.summary}</p>
          </div>
          <PurchasePanel product={product} />
          <Description text={product.description} />
        </div>
      </div>
      <div className="mt-12 space-y-10">
        <SpecTable specs={product.specs} />
        <IncludedList included={product.included} notIncluded={product.notIncluded} />
        <Downloads downloads={product.downloads} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run lint && npm run build && ls out/products/custom-propeller/index.html
```

`npm run dev` → `/products/custom-propeller/`: selecting "4 sets" changes the price to $20.99; Add to cart bumps the header badge (drawer arrives next task).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add product detail page with variants and purchase panel

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Cart drawer and Playwright smoke test

**Files:**
- Create: `src/components/cart/CartDrawer.tsx`, `src/components/cart/CartLineRow.tsx`, `src/components/cart/CartSummary.tsx`, `src/components/cart/ShippingNote.tsx`, `e2e/smoke.spec.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useCart`, `useCartLines` (Task 8), `subtotalCents`, `formatCents`.
- Produces: `CartLineRow({ line })`, `CartSummary({ lines })`, `ShippingNote()` reused by the checkout page (Task 14); `CartDrawer` renders `<div data-testid="paypal-slot" />` that Task 14 replaces with PayPal buttons.

- [ ] **Step 1: Write the failing smoke test**

`e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home → catalog search → product → cart drawer → persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /featured kits/i })).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(5);

  await page.goto('/products/');
  await page.getByTestId('search').fill('mylar');
  await expect(page.getByTestId('product-card')).toHaveCount(2);
  await expect(page).toHaveURL(/q=mylar/);

  await page.goto('/products/custom-propeller/');
  await expect(page.getByTestId('variant-select')).toBeVisible();
  await expect(page.getByTestId('price')).toHaveText('$12.99');
  await page.getByTestId('add-to-cart').click();

  const drawer = page.getByRole('dialog', { name: /your cart/i });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId('subtotal')).toHaveText('$12.99');
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  await page.reload();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await page.getByTestId('cart-trigger').click();
  await expect(page.getByRole('dialog', { name: /your cart/i }).getByTestId('subtotal')).toHaveText('$12.99');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run e2e`
Expected: FAIL at the drawer assertion (no dialog yet).

- [ ] **Step 3: Components**

`src/components/cart/ShippingNote.tsx`:

```tsx
export function ShippingNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Shipping is selected in PayPal (USPS Ground or Priority). US addresses only. Tax, if any, is applied by PayPal.
    </p>
  );
}
```

`src/components/cart/CartSummary.tsx`:

```tsx
import { subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';
import { formatCents } from '@/lib/format';

export function CartSummary({ lines }: { lines: CartLine[] }) {
  return (
    <div className="flex items-center justify-between text-base font-medium">
      <span>Subtotal</span>
      <span data-testid="subtotal">{formatCents(subtotalCents(lines))}</span>
    </div>
  );
}
```

`src/components/cart/CartLineRow.tsx`:

```tsx
'use client';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CartLine } from '@/lib/cart/resolve';
import { useCart } from '@/lib/cart/store';
import { formatCents } from '@/lib/format';

export function CartLineRow({ line }: { line: CartLine }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const multi = line.product.variants.length > 1;
  return (
    <li className="flex gap-3 py-3" data-testid="cart-line">
      <div className="relative size-16 shrink-0 overflow-hidden rounded border bg-muted">
        <Image src={line.product.images[0].src} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 text-sm">
        <Link href={`/products/${line.product.slug}/`} className="font-medium hover:underline">{line.product.name}</Link>
        {multi && <span className="text-muted-foreground">{line.variant.label}</span>}
        <div className="mt-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-7" aria-label="Decrease quantity" onClick={() => setQty(line.sku, line.qty - 1)}>
            <Minus className="size-3" />
          </Button>
          <span className="w-6 text-center">{line.qty}</span>
          <Button variant="outline" size="icon" className="size-7" aria-label="Increase quantity" onClick={() => setQty(line.sku, line.qty + 1)}>
            <Plus className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-1 size-7" aria-label={`Remove ${line.product.name}`} onClick={() => remove(line.sku)}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-medium">{formatCents(line.lineTotalCents)}</div>
    </li>
  );
}
```

`src/components/cart/CartDrawer.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { CartLineRow } from './CartLineRow';
import { CartSummary } from './CartSummary';
import { ShippingNote } from './ShippingNote';

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const open = useCart((s) => s.open);
  const lines = useCartLines();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? open() : close())}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {lines.map((l) => (
                <CartLineRow key={l.sku} line={l} />
              ))}
            </ul>
            <Separator />
            <div className="space-y-3 p-4">
              <CartSummary lines={lines} />
              <ShippingNote />
              <div data-testid="paypal-slot" />
              <Button asChild variant="outline" className="w-full" onClick={close}>
                <Link href="/checkout/">Review order</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

Modify `src/app/layout.tsx`: add `import { CartDrawer } from '@/components/cart/CartDrawer';` and render `<CartDrawer />` immediately after `<Header />`.

- [ ] **Step 4: Run the smoke test**

Run: `npm run lint && npm run e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add cart drawer and Playwright smoke test

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: PayPal order builder, Smart Buttons, and checkout page

**Files:**
- Create: `src/lib/paypal/order.ts`, `src/lib/paypal/summary.ts`, `src/components/checkout/PayPalCheckout.tsx`, `src/components/checkout/CheckoutView.tsx`, `src/app/checkout/page.tsx`, `src/test/paypal-order.test.ts`, `src/test/paypal-summary.test.ts`
- Modify: `src/components/cart/CartDrawer.tsx` (replace the slot), `e2e/smoke.spec.ts` (extend)

**Interfaces:**
- Consumes: `CartLine`, `subtotalCents`, `site`, `getShippingOption`, `defaultShippingOption`, `useCart`, `useCartLines`, `fillTemplate`, `CartLineRow`, `CartSummary`, `ShippingNote`.
- Produces:
  - `lineName(line: CartLine): string` (appends ` – <variant label>` only for multi-variant products)
  - `buildOrder(lines: CartLine[], shippingId: string): CreateOrderRequestBody`
  - `buildAmountPatch(lines, shippingId): PatchOrderRequestBody`
  - `OrderSummary { orderId; captureId?; status; payerEmail?; shippingName?; shippingLabel?; totalCents; lines: { sku; name; qty; unitCents }[]; notes: string[] }`
  - `summarizeOrder(details: OrderResponseBody, lines: CartLine[]): OrderSummary`
  - `LAST_ORDER_KEY = 'wsk-last-order'`
  - `PayPalCheckout()` and `CheckoutView()` client components

- [ ] **Step 1: Install**

```bash
npm install @paypal/react-paypal-js
```

- [ ] **Step 2: Failing tests**

`src/test/paypal-order.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveLines } from '@/lib/cart/resolve';
import { buildAmountPatch, buildOrder } from '@/lib/paypal/order';

const lines = resolveLines([
  { sku: 'ADV-KIT', qty: 1 },
  { sku: 'CPROP-4', qty: 2 },
]);

describe('buildOrder', () => {
  const order = buildOrder(lines, 'usps-ground');
  const pu = order.purchase_units[0];

  it('is a CAPTURE order with one purchase unit', () => {
    expect(order.intent).toBe('CAPTURE');
    expect(order.purchase_units).toHaveLength(1);
  });

  it('lists items with sku, quantity, unit price, and physical category', () => {
    expect(pu.items).toEqual([
      { name: 'Advanced Kit', sku: 'ADV-KIT', quantity: '1', unit_amount: { currency_code: 'USD', value: '75.99' }, category: 'PHYSICAL_GOODS' },
      { name: 'Custom Laser-cut Propeller – 4 sets', sku: 'CPROP-4', quantity: '2', unit_amount: { currency_code: 'USD', value: '20.99' }, category: 'PHYSICAL_GOODS' },
    ]);
  });

  it('amount equals items plus shipping with a matching breakdown', () => {
    expect(pu.amount).toEqual({
      currency_code: 'USD',
      value: '124.47',
      breakdown: { item_total: { currency_code: 'USD', value: '117.97' }, shipping: { currency_code: 'USD', value: '6.50' } },
    });
  });

  it('passes both shipping options with the chosen one selected', () => {
    expect(pu.shipping?.options?.map((o) => [o.id, o.selected, o.amount?.value])).toEqual([
      ['usps-ground', true, '6.50'],
      ['usps-priority', false, '10.50'],
    ]);
    const other = buildOrder(lines, 'usps-priority').purchase_units[0];
    expect(other.amount.value).toBe('128.47');
    expect(other.shipping?.options?.find((o) => o.id === 'usps-priority')?.selected).toBe(true);
  });

  it('falls back to the default option for an unknown shipping id', () => {
    expect(buildOrder(lines, 'nope').purchase_units[0].amount.value).toBe('124.47');
  });

  it('encodes skus in custom_id and asks PayPal to collect the address', () => {
    expect(pu.custom_id).toBe('ADV-KITx1,CPROP-4x2');
    expect(order.application_context?.shipping_preference).toBe('GET_FROM_FILE');
    expect(order.application_context?.user_action).toBe('PAY_NOW');
  });
});

describe('buildAmountPatch', () => {
  it('replaces the default purchase unit amount', () => {
    expect(buildAmountPatch(lines, 'usps-priority')).toEqual([
      {
        op: 'replace',
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: 'USD',
          value: '128.47',
          breakdown: { item_total: { currency_code: 'USD', value: '117.97' }, shipping: { currency_code: 'USD', value: '10.50' } },
        },
      },
    ]);
  });
});
```

`src/test/paypal-summary.test.ts`:

```ts
import type { OrderResponseBody } from '@paypal/paypal-js';
import { describe, expect, it } from 'vitest';
import { resolveLines } from '@/lib/cart/resolve';
import { summarizeOrder } from '@/lib/paypal/summary';

const lines = resolveLines([
  { sku: 'CPROP-2', qty: 1 },
  { sku: 'PROP-KIT', qty: 3 },
]);

const details = {
  id: 'ORDER123',
  status: 'COMPLETED',
  payer: { email_address: 'buyer@example.com' },
  purchase_units: [
    {
      shipping: { name: { full_name: 'Pat Buyer' }, options: [{ id: 'usps-priority', label: 'USPS Priority Mail', selected: true }] },
      payments: { captures: [{ id: 'CAP456', status: 'COMPLETED', amount: { currency_code: 'USD', value: '44.46' } }] },
    },
  ],
} as unknown as OrderResponseBody;

describe('summarizeOrder', () => {
  it('extracts ids, payer, shipping, total, and lines', () => {
    const s = summarizeOrder(details, lines);
    expect(s.orderId).toBe('ORDER123');
    expect(s.captureId).toBe('CAP456');
    expect(s.status).toBe('COMPLETED');
    expect(s.payerEmail).toBe('buyer@example.com');
    expect(s.shippingName).toBe('Pat Buyer');
    expect(s.shippingLabel).toBe('USPS Priority Mail');
    expect(s.totalCents).toBe(4446);
    expect(s.lines).toEqual([
      { sku: 'CPROP-2', name: 'Custom Laser-cut Propeller – 2 sets', qty: 1, unitCents: 1299 },
      { sku: 'PROP-KIT', name: 'Propeller Kit', qty: 3, unitCents: 699 },
    ]);
  });

  it('collects post-purchase notes with the contact email filled in', () => {
    const s = summarizeOrder(details, lines);
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0]).toContain('orders@wrightstuffkits.com');
    expect(s.notes[0]).not.toContain('{contactEmail}');
  });

  it('tolerates missing optional fields', () => {
    const s = summarizeOrder({ id: 'X', status: 'COMPLETED' } as unknown as OrderResponseBody, lines);
    expect(s.captureId).toBeUndefined();
    expect(s.totalCents).toBe(0);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- --run src/test/paypal-order.test.ts src/test/paypal-summary.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement order builder and summary**

`src/lib/paypal/order.ts`:

```ts
import type { CreateOrderRequestBody, PatchOrderRequestBody } from '@paypal/paypal-js';
import { defaultShippingOption, getShippingOption, site } from '@/content/site';
import { subtotalCents } from '@/lib/cart/pricing';
import type { CartLine } from '@/lib/cart/resolve';

const usd = (cents: number) => ({ currency_code: 'USD', value: (cents / 100).toFixed(2) });

export function lineName(line: CartLine): string {
  return line.product.variants.length > 1 ? `${line.product.name} – ${line.variant.label}` : line.product.name;
}

function resolveShippingId(shippingId: string): string {
  return (getShippingOption(shippingId) ?? defaultShippingOption()).id;
}

function amountFor(lines: CartLine[], shippingId: string) {
  const shipping = getShippingOption(resolveShippingId(shippingId))!;
  const itemTotal = subtotalCents(lines);
  return {
    ...usd(itemTotal + shipping.amountCents),
    breakdown: { item_total: usd(itemTotal), shipping: usd(shipping.amountCents) },
  };
}

export function buildOrder(lines: CartLine[], shippingId: string): CreateOrderRequestBody {
  const chosen = resolveShippingId(shippingId);
  return {
    intent: 'CAPTURE',
    purchase_units: [
      {
        custom_id: lines.map((l) => `${l.sku}x${l.qty}`).join(','),
        items: lines.map((l) => ({
          name: lineName(l),
          sku: l.sku,
          quantity: String(l.qty),
          unit_amount: usd(l.variant.priceCents),
          category: 'PHYSICAL_GOODS' as const,
        })),
        amount: amountFor(lines, chosen),
        shipping: {
          options: site.shippingOptions.map((o) => ({
            id: o.id,
            label: o.label,
            type: 'SHIPPING' as const,
            selected: o.id === chosen,
            amount: usd(o.amountCents),
          })),
        },
      },
    ],
    application_context: { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
  };
}

export function buildAmountPatch(lines: CartLine[], shippingId: string): PatchOrderRequestBody {
  return [
    {
      op: 'replace',
      path: "/purchase_units/@reference_id=='default'/amount",
      value: amountFor(lines, resolveShippingId(shippingId)),
    },
  ];
}
```

If TypeScript rejects a field against the generated OpenAPI types, cast only that object (for example `as CreateOrderRequestBody['purchase_units'][number]`) rather than loosening the return type.

`src/lib/paypal/summary.ts`:

```ts
import type { OrderResponseBody } from '@paypal/paypal-js';
import { site } from '@/content/site';
import type { CartLine } from '@/lib/cart/resolve';
import { fillTemplate } from '@/lib/format';
import { lineName } from './order';

export const LAST_ORDER_KEY = 'wsk-last-order';

export interface OrderSummary {
  orderId: string;
  captureId?: string;
  status: string;
  payerEmail?: string;
  shippingName?: string;
  shippingLabel?: string;
  totalCents: number;
  lines: { sku: string; name: string; qty: number; unitCents: number }[];
  notes: string[];
}

export function summarizeOrder(details: OrderResponseBody, lines: CartLine[]): OrderSummary {
  const pu = details.purchase_units?.[0];
  const capture = pu?.payments?.captures?.[0];
  const totalValue = capture?.amount?.value;
  const notes = Array.from(
    new Set(lines.map((l) => l.product.postPurchaseNote).filter((n): n is string => Boolean(n))),
  ).map((n) => fillTemplate(n, { contactEmail: site.contactEmail }));

  return {
    orderId: details.id ?? '',
    captureId: capture?.id,
    status: capture?.status ?? details.status ?? 'UNKNOWN',
    payerEmail: details.payer?.email_address,
    shippingName: pu?.shipping?.name?.full_name,
    shippingLabel: pu?.shipping?.options?.find((o) => o.selected)?.label,
    totalCents: totalValue ? Math.round(Number(totalValue) * 100) : 0,
    lines: lines.map((l) => ({ sku: l.sku, name: lineName(l), qty: l.qty, unitCents: l.variant.priceCents })),
    notes,
  };
}
```

- [ ] **Step 5: Run unit tests**

Run: `npm test -- --run`
Expected: all pass.

- [ ] **Step 6: Buttons component**

`src/components/checkout/PayPalCheckout.tsx`:

```tsx
'use client';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { defaultShippingOption, site } from '@/content/site';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { buildAmountPatch, buildOrder } from '@/lib/paypal/order';
import { LAST_ORDER_KEY, summarizeOrder } from '@/lib/paypal/summary';

const SDK_OPTIONS = { clientId: site.paypalClientId, currency: 'USD', intent: 'capture', components: 'buttons' };
const DECLINED_MSG = 'That payment method was declined. Please choose another.';
const FAILED_MSG = 'PayPal could not complete the payment. Your cart is unchanged.';

export function PayPalCheckout() {
  const lines = useCartLines();
  const clear = useCart((s) => s.clear);
  const close = useCart((s) => s.close);
  const router = useRouter();
  const shippingRef = useRef(defaultShippingOption().id);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) return null;
  const cartKey = lines.map((l) => `${l.sku}:${l.qty}`).join('|');

  return (
    <div data-testid="paypal-buttons" className="space-y-2">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <PayPalScriptProvider options={SDK_OPTIONS}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect' }}
          forceReRender={[cartKey]}
          createOrder={(_data, actions) => {
            setError(null);
            shippingRef.current = defaultShippingOption().id;
            return actions.order.create(buildOrder(lines, shippingRef.current));
          }}
          // Legacy callback: the only client-side way to re-price shipping without a server.
          // PayPal marks it deprecated, but the v5 SDK that PayPalScriptProvider loads still serves it.
          onShippingChange={async (data, actions) => {
            if (site.usOnly && data.shipping_address && data.shipping_address.country_code !== 'US') {
              return actions.reject();
            }
            const selected = data.selected_shipping_option?.id;
            if (selected) shippingRef.current = selected;
            return actions.order.patch(buildAmountPatch(lines, shippingRef.current));
          }}
          onApprove={async (_data, actions) => {
            if (!actions.order) return;
            try {
              const details = await actions.order.capture();
              const capture = details.purchase_units?.[0]?.payments?.captures?.[0];
              if (capture?.status === 'DECLINED') {
                setError(DECLINED_MSG);
                return actions.restart();
              }
              sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summarizeOrder(details, lines)));
              clear();
              close();
              router.push('/order/confirmed/');
            } catch (err) {
              const issue = (err as { details?: { issue?: string }[] })?.details?.[0]?.issue;
              if (issue === 'INSTRUMENT_DECLINED') {
                setError(DECLINED_MSG);
                return actions.restart();
              }
              setError(FAILED_MSG);
              toast.error(FAILED_MSG);
            }
          }}
          onCancel={() => setError(null)}
          onError={() => {
            setError(FAILED_MSG);
            toast.error(FAILED_MSG);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
```

In `src/components/cart/CartDrawer.tsx`, replace `<div data-testid="paypal-slot" />` with `<PayPalCheckout />` and add `import { PayPalCheckout } from '@/components/checkout/PayPalCheckout';`. Because the provider lives inside the drawer and checkout page, the PayPal script is only fetched when buttons render; `loadScript` dedupes by URL so it never loads twice.

- [ ] **Step 7: Checkout page**

`src/components/checkout/CheckoutView.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { CartLineRow } from '@/components/cart/CartLineRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { ShippingNote } from '@/components/cart/ShippingNote';
import { Button } from '@/components/ui/button';
import { useCartLines } from '@/lib/cart/hooks';
import { useCart } from '@/lib/cart/store';
import { PayPalCheckout } from './PayPalCheckout';

export function CheckoutView() {
  const hydrated = useCart((s) => s.hasHydrated);
  const lines = useCartLines();
  if (!hydrated) return null;
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4"><Link href="/products/">Browse products</Link></Button>
      </div>
    );
  }
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y">
        {lines.map((l) => (
          <CartLineRow key={l.sku} line={l} />
        ))}
      </ul>
      <aside className="space-y-4 rounded-lg border p-4">
        <CartSummary lines={lines} />
        <ShippingNote />
        <PayPalCheckout />
      </aside>
    </div>
  );
}
```

`src/app/checkout/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/CheckoutView';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <CheckoutView />
    </main>
  );
}
```

- [ ] **Step 8: Extend the smoke test**

Append inside the existing test in `e2e/smoke.spec.ts`, after the last subtotal assertion:

```ts
  await expect(page.getByRole('dialog', { name: /your cart/i }).getByTestId('paypal-buttons')).toBeVisible();
  await page.goto('/checkout/');
  await expect(page.getByTestId('subtotal')).toHaveText('$12.99');
  await expect(page.getByTestId('paypal-buttons')).toBeVisible();
```

- [ ] **Step 9: Verify**

```bash
npm run lint && npm test -- --run && npm run e2e
```

Expected: all green. Then a manual sandbox check with a real sandbox client ID in `.env.local` and `npm run dev`: add Advanced Kit + 4-set custom prop, open the drawer, click PayPal, log in with the sandbox personal account, switch shipping to Priority, confirm the total becomes $128.47, pay. Expect navigation to `/order/confirmed/` (a 404 until Task 15 is done; that is fine for this task) and the cart badge at 0.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add PayPal order builder, Smart Buttons, and checkout page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Order confirmation page

**Files:**
- Create: `src/components/checkout/OrderConfirmation.tsx`, `src/app/order/confirmed/page.tsx`
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `OrderSummary`, `LAST_ORDER_KEY` (Task 14), `formatCents`.

- [ ] **Step 1: Write failing Playwright tests**

Append to `e2e/smoke.spec.ts`:

```ts
test('order confirmation renders from sessionStorage and shows custom-prop note', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem(
      'wsk-last-order',
      JSON.stringify({
        orderId: 'TEST-ORDER',
        captureId: 'TEST-CAP',
        status: 'COMPLETED',
        payerEmail: 'b@example.com',
        shippingName: 'Pat',
        shippingLabel: 'USPS Ground Advantage',
        totalCents: 1949,
        lines: [{ sku: 'CPROP-2', name: 'Custom Laser-cut Propeller – 2 sets', qty: 1, unitCents: 1299 }],
        notes: ['Email your propeller design and your PayPal order ID to orders@wrightstuffkits.com.'],
      }),
    );
  });
  await page.goto('/order/confirmed/');
  await expect(page.getByTestId('order-confirmation')).toContainText('TEST-ORDER');
  await expect(page.getByTestId('order-confirmation')).toContainText('$19.49');
  await expect(page.getByText(/email your propeller design/i)).toBeVisible();
});

test('order confirmation without an order shows fallback', async ({ page }) => {
  await page.goto('/order/confirmed/');
  await expect(page.getByText(/no recent order found/i)).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run e2e`
Expected: the two new tests FAIL (404 page).

- [ ] **Step 3: Component and page**

`src/components/checkout/OrderConfirmation.tsx`:

```tsx
'use client';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/lib/format';
import { LAST_ORDER_KEY, type OrderSummary } from '@/lib/paypal/summary';

export function OrderConfirmation() {
  const [order, setOrder] = useState<OrderSummary | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      setOrder(raw ? (JSON.parse(raw) as OrderSummary) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) return null;
  if (order === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No recent order found.</p>
        <Button asChild className="mt-4"><Link href="/products/">Back to the shop</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6" data-testid="order-confirmation">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">Thanks for your order!</h1>
          <p className="text-sm text-muted-foreground">
            PayPal has emailed your receipt{order.payerEmail ? ` to ${order.payerEmail}` : ''}.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border p-4 text-sm">
        <dt className="text-muted-foreground">Order ID</dt><dd className="font-mono">{order.orderId}</dd>
        {order.captureId && (<><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono">{order.captureId}</dd></>)}
        {order.shippingName && (<><dt className="text-muted-foreground">Ship to</dt><dd>{order.shippingName}</dd></>)}
        {order.shippingLabel && (<><dt className="text-muted-foreground">Shipping</dt><dd>{order.shippingLabel}</dd></>)}
        <dt className="text-muted-foreground">Total</dt><dd className="font-medium">{formatCents(order.totalCents)}</dd>
      </dl>

      <ul className="divide-y rounded-lg border text-sm">
        {order.lines.map((l) => (
          <li key={l.sku} className="flex justify-between p-3">
            <span>{l.name} × {l.qty}</span>
            <span>{formatCents(l.unitCents * l.qty)}</span>
          </li>
        ))}
      </ul>

      {order.notes.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <p className="mb-1 font-semibold">One more step</p>
          {order.notes.map((n) => (<p key={n}>{n}</p>))}
        </div>
      )}

      <Button asChild variant="outline"><Link href="/products/">Continue shopping</Link></Button>
    </div>
  );
}
```

`src/app/order/confirmed/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

export default function OrderConfirmedPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <OrderConfirmation />
    </main>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run lint && npm run e2e
git add -A
git commit -m "Add order confirmation page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: Static pages, 404, sitemap, robots

**Files:**
- Create: `src/content/faq.ts`, `src/app/about/page.tsx`, `src/app/faq/page.tsx`, `src/app/contact/page.tsx`, `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`

**Interfaces:**
- Consumes: `site`, `products`.

- [ ] **Step 1: FAQ content**

`src/content/faq.ts`:

```ts
export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  { q: 'Where do you ship?', a: 'United States only. You choose USPS Ground Advantage or Priority Mail inside PayPal at checkout.' },
  { q: 'How long until my order ships?', a: 'Kits usually ship within 2 business days. Custom laser-cut propellers ship within 5 business days of receiving your design file.' },
  { q: 'Do the kits meet Science Olympiad rules?', a: 'All three kits are designed to comply with Division C 2027 Flight rules. Always check the current rules manual and your event supervisor for the final word.' },
  { q: 'What tools do I need?', a: 'Super glue (CA), a hobby knife, spray adhesive, pliers, and a winder. These are not included in any kit.' },
  { q: 'How do I send my custom propeller design?', a: 'After paying, email the design (DXF preferred, or any image with a size) and your PayPal order ID to the address shown on the confirmation page.' },
  { q: 'What is your return policy?', a: 'Unopened kits can be returned within 30 days for a refund minus shipping. Custom propellers are made to order and cannot be returned. If anything arrives damaged, email us within 7 days with photos and we will replace it.' },
  { q: 'Do you charge sales tax?', a: 'Tax, where required, is calculated by PayPal at checkout.' },
];
```

- [ ] **Step 2: Pages**

`src/app/faq/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { faq } from '@/content/faq';

export const metadata: Metadata = { title: 'FAQ, shipping & returns' };

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">FAQ, shipping &amp; returns</h1>
      <dl className="space-y-6">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold">{f.q}</dt>
            <dd className="mt-1 text-muted-foreground">{f.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
```

`src/app/about/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">About {site.name}</h1>
      <p>
        {site.name} designs and laser-cuts rubber-powered indoor free-flight kits for Science Olympiad competitors. Every kit is built and flown before it is sold, and the instructions cover the parts most kits skip: making the rubber motor, winding, and trimming for long flights.
      </p>
      <p>Each kit includes parts for two airplanes so you have a backup on competition day.</p>
      <p>
        Questions or custom requests? Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </main>
  );
}
```

`src/app/contact/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p>
        Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. We reply within one business day.
      </p>
      <p>For custom propellers, attach your design (DXF preferred, or an image with a size) and include your PayPal order ID in the subject line.</p>
    </main>
  );
}
```

`src/app/not-found.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
    </main>
  );
}
```

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ['', 'products/', 'about/', 'faq/', 'contact/'].map((p) => ({ url: `${site.url}/${p}` }));
  const prods = products.map((p) => ({ url: `${site.url}/products/${p.slug}/` }));
  return [...statics, ...prods];
}
```

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout/', '/order/'] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run lint && npm run build && ls out/sitemap.xml out/robots.txt out/faq/index.html
git add -A
git commit -m "Add about, FAQ, contact, 404, sitemap, and robots

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 17: Launch: owner inputs, custom domain, live credentials, final verification

**Files:**
- Modify: `src/content/site.ts` (contact email and real shipping rates), `README.md` (launch runbook)

**Interfaces:** none new.

- [ ] **Step 1: Owner inputs**

Ask the owner for the real contact email and the two USPS rates to charge. Set them in `src/content/site.ts` and run `npm test -- --run` (the paypal-order tests assert `6.50` and `10.50`; update those expected strings to the new rates in the same commit).

```bash
git add src/content/site.ts src/test/paypal-order.test.ts
git commit -m "Set launch contact email and shipping rates

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 2: Full sandbox checklist** (spec §12; sandbox client ID in `.env.local`, `npm run dev`)

- [ ] One order with each kit, the propeller kit, and a 4-set custom propeller; PayPal receipt lists each SKU and unit price.
- [ ] Change shipping option inside PayPal; total updates; captured total matches the site's expectation.
- [ ] Non-US sandbox address is refused.
- [ ] Negative testing `INSTRUMENT_DECLINED`: buttons restart with the inline error.
- [ ] Cancel the popup; cart unchanged.
- [ ] Confirmation page shows order ID and the custom-prop email note; cart badge is 0 after reload.
- [ ] Seller sandbox email shows shipping address and line items.

- [ ] **Step 3: DNS and Pages**

At the registrar (Cloudflare per `inventory/kits.txt`): `A` records for `wrightstuffkits.com` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `CNAME www` → `<github-user>.github.io`. On Cloudflare set these records to DNS-only (grey cloud) so GitHub can issue the certificate. In GitHub → Settings → Pages: Custom domain `wrightstuffkits.com`, wait for the DNS check, then enable **Enforce HTTPS**.

- [ ] **Step 4: Live client ID**

Follow `docs/PAYPAL_SETUP.md` §3: set the `PAYPAL_CLIENT_ID` secret to the live Client ID and re-run the workflow. Visit https://wrightstuffkits.com and confirm the PayPal button loads without a sandbox banner.

- [ ] **Step 5: Live smoke purchase**

From a second PayPal account buy the Propeller Kit, confirm the seller email arrives, then refund it from PayPal Activity.

- [ ] **Step 6: Lighthouse and search files**

Run Chrome Lighthouse (mobile) on `/` and `/products/advanced-kit/`; expect Performance ≥ 90 and no console errors. Confirm https://wrightstuffkits.com/robots.txt and `/sitemap.xml` load. Paste a product URL into https://validator.schema.org and confirm the Product entity validates.

- [ ] **Step 7: README launch runbook and final push**

Append to `README.md`:

```md
## Launch runbook

1. Set `contactEmail` and `shippingOptions` in `src/content/site.ts`.
2. Add the live PayPal Client ID as the `PAYPAL_CLIENT_ID` repository secret (see `docs/PAYPAL_SETUP.md`).
3. Point DNS at GitHub Pages and enable HTTPS (Settings → Pages).
4. Push to `main`; the workflow builds, tests, and deploys.
```

```bash
git add README.md
git commit -m "Document launch runbook

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review notes

- **Spec coverage.** §3 catalog → Task 6; §4 layout → Tasks 1–3, 9; §5 data model → Task 5; §6 cart → Tasks 8, 13; §7 PayPal → Task 14; confirmation → Task 15; §8 pages → Tasks 10–12, 16; §9 build/deploy → Tasks 1, 4, 17; §10 testing → Tasks 3, 5–8, 13–15; §12 launch → Task 17; §13 PayPal guide → Task 4.
- **Deviation from spec §7.** The spec names `onShippingOptionsChange`/`onShippingAddressChange`. Verified against `@paypal/paypal-js` 11 types: those callbacks only offer `buildOrderPatchPayload` and expect a server-side PATCH. The deprecated `onShippingChange` is the only callback with client-side `actions.order.patch()` and `actions.reject()`, so Task 14 uses it. The spec's intent (buyer picks shipping inside PayPal, site re-prices, non-US rejected) is preserved. If PayPal removes `onShippingChange` from the v5 SDK, fall back to a single flat shipping option with no callback.
- **Deviation from spec §7, lazy loading.** Instead of `deferLoading` on a root-level provider, the provider is mounted inside the drawer and checkout page. Same effect (SDK loads only when buttons render), simpler code.
- **Deviation from spec §5.** Image/download path existence is asserted by a Vitest test (runs before `next build` in CI) rather than inside the catalog loader, which must stay free of `fs` because the client bundle imports it.
- **Type consistency.** `CartItem`/`CartLine`/`useCart`/`useCartLines` (Task 8) are what Tasks 9, 12–15 consume; `lineName`/`buildOrder`/`buildAmountPatch`/`summarizeOrder`/`LAST_ORDER_KEY`/`OrderSummary` (Task 14) are what Task 15 consumes; `ProductGrid`/`ProductCard` (Task 10) are reused in Task 11; `CartLineRow`/`CartSummary`/`ShippingNote` (Task 13) are reused in Task 14.
