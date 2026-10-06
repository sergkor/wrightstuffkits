# Website Changes (Oct 2026) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the owner's October 2026 change list: drop the logo, simplify the home hero, rewrite About, rename Advanced→Elliptical and Intermediate→Classic, remove the Specifications/In-the-box sections, update kit copy, swap in re-rendered product images, and add an $84.99 Classic + Elliptical package.

**Architecture:** Content lives in typed TS files under `src/content/products/` validated by Zod at build; pages are static Next.js App Router components. Every change here is content, copy, or a component removal — no new runtime logic. Images are produced from untracked sources in `inventory/` by `scripts/prepare-images.mjs` (sharp) into tracked `public/images/products/<slug>/`.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Zod 4, Tailwind 4, Vitest 5, Playwright, sharp.

**Spec:** `docs/superpowers/specs/2026-10-05-website-changes.md` (verbatim transcription of the owner's Google Doc plus interpretation decisions). Original store design: `docs/superpowers/specs/2026-10-01-wrightstuffkits-store-design.md`.

## Global Constraints

- Copy from the spec is used verbatim except: "Carbon fiber rods" → "carbon fiber rods" (mid-sentence), "24cm pvc" → "24 cm PVC" (matches existing unit style), "Comes materials" → "Comes with materials" (grammar).
- Kit renames: `advanced-kit`/`ADV-KIT`/"Advanced Kit" → `elliptical-kit`/`ELL-KIT`/"Elliptical Kit"; `intermediate-kit`/`INT-KIT`/"Intermediate Kit" → `classic-kit`/`CLS-KIT`/"Classic Kit". Prices unchanged ($75.99 each).
- Package: slug `classic-elliptical-package`, SKU `PKG-CLS-ELL`, name "Classic + Elliptical Kit Package", `priceCents: 8499`, category `kits`, `featured: true`.
- Favicon (`src/app/icon.png`, `apple-icon.png`, `favicon.ico`) stays. Only `public/images/brand/logo.png` and its two usages go.
- `specs` and `included` leave the product schema entirely. `notIncluded` ("You will need") stays.
- Source renders are already staged at `inventory/renders/{beginner,elliptical,classic,package}.png` (untracked; `inventory/` is gitignored). Do not commit them.
- Run every command from the repo root `/Users/skorniychuk/dev/wrightstuffkits`. `npm test -- --run` runs Vitest once; `npm run lint` is ESLint; `npm run build` needs `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (present in `.env.local`); `npx playwright test` serves `out/` itself.
- One commit per task. Commit messages end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

---

### Task 1: Remove the logo and update the home hero

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/app/page.tsx`
- Modify: `scripts/prepare-brand.mjs:1-7,50-58`
- Delete: `public/images/brand/logo.png`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `site.tagline` from `src/content/site.ts` (= "Science Olympiad free-flight kits and propeller supplies").
- Produces: home page without the compare table, so Task 2 can drop `Product.specs` safely.

- [ ] **Step 1: Add e2e assertions for the new hero and the removed section**

In `e2e/smoke.spec.ts`, replace the first two assertions of the first test so it opens with:

```ts
test('home → catalog search → product → cart drawer → persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Rubber-Powered Plane Kits' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /which kit/i })).toHaveCount(0);
  await expect(page.getByRole('banner').locator('img')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /featured kits/i })).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(5);
```

Keep the rest of the test unchanged. (The `product-card` count becomes 6 in Task 7.)

- [ ] **Step 2: Rewrite `src/components/layout/Header.tsx` without the image**

```tsx
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
        <Link href="/" className="font-semibold">
          {site.name}
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

- [ ] **Step 3: Rewrite `src/app/page.tsx`**

Drops the `Image` import, the `compare` mapping, the hero image, and the "Which kit?" section; updates the h1 and paragraph.

```tsx
import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import { site } from '@/content/site';
import { products } from '@/lib/catalog';

export default function HomePage() {
  const featured = products.filter((p) => p.featured);
  const propellers = products.filter((p) => p.category === 'propellers');

  return (
    <main>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Science Olympiad Division C 2027</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">Rubber-Powered Plane Kits</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {site.tagline}. Laser-cut parts, carbon fiber rods, covering, and other building supplies with step-by-step instructions that cover building and flight testing.
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

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">Propellers</h2>
        <ProductGrid products={propellers} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Stop generating the logo and delete it**

In `scripts/prepare-brand.mjs`:
- Line 1 comment → `// Builds the site favicons from marketing/logo.jpeg.`
- Change the fs import to `import { writeFile } from 'node:fs/promises';`
- Delete `const BRAND_DIR = 'public/images/brand';` (line 7) and `await mkdir(BRAND_DIR, { recursive: true });` (line 50).
- In `outputs`, delete the `` [`${BRAND_DIR}/logo.png`, 512], `` entry so it reads:

```js
const outputs = [
  ['src/app/icon.png', 512],
  ['src/app/apple-icon.png', 180],
];
```

Then:

```bash
git rm -q public/images/brand/logo.png
grep -rn "images/brand" src scripts && echo "STILL REFERENCED" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Lint, unit tests, build, e2e**

```bash
npm run lint && npm test -- --run && npm run build && npx playwright test
```

Expected: lint clean; all Vitest files pass; build succeeds; the 3 e2e tests pass with the new hero assertions.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/layout/Header.tsx src/app/page.tsx scripts/prepare-brand.mjs public/images/brand e2e/smoke.spec.ts docs/superpowers/specs/2026-10-05-website-changes.md docs/superpowers/plans/2026-10-05-website-changes.md
git commit -m "Home: drop logo and compare table, new hero copy

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Remove the Specifications and In-the-box sections

**Files:**
- Modify: `src/lib/catalog/schema.ts:25-26`
- Delete: `src/components/product/SpecTable.tsx`
- Delete: `src/components/product/IncludedList.tsx`
- Create: `src/components/product/NeededList.tsx`
- Modify: `src/app/products/[slug]/page.tsx`
- Modify: `src/content/products/{advanced-kit,intermediate-kit,beginner-kit,propeller-kit,custom-propeller}.ts` (remove `specs` and `included` blocks)
- Test: `src/test/catalog-schema.test.ts:16-22`

**Interfaces:**
- Produces: `Product` no longer has `specs` or `included`. `NeededList({ items: string[] })` renders the "You will need" list and returns `null` when empty.

- [ ] **Step 1: Make the schema test reject the removed fields**

In `src/test/catalog-schema.test.ts`, replace the `applies defaults` test:

```ts
  it('applies defaults', () => {
    const [p] = buildCatalog([base]);
    expect(p.notIncluded).toEqual([]);
    expect(p.featured).toBe(false);
    expect(p.variants[0].inStock).toBe(true);
    expect(p).not.toHaveProperty('specs');
    expect(p).not.toHaveProperty('included');
  });
```

- [ ] **Step 2: Run it to see it fail**

```bash
npm test -- --run src/test/catalog-schema.test.ts
```

Expected: FAIL — `expected { … specs: {} … } to not have property "specs"`.

- [ ] **Step 3: Remove the fields from the schema**

In `src/lib/catalog/schema.ts`, delete these two lines from `ProductSchema`:

```ts
  specs: z.record(z.string(), z.string()).default({}),
  included: z.array(z.string()).default([]),
```

- [ ] **Step 4: Remove `specs` and `included` from all five content files**

For each of `src/content/products/advanced-kit.ts`, `intermediate-kit.ts`, `beginner-kit.ts`, `propeller-kit.ts`, `custom-propeller.ts`, delete the whole `specs: { … },` object and the whole `included: [ … ],` array. Keep `notIncluded`. Example of the resulting tail of `propeller-kit.ts`:

```ts
  images: [{ src: '/images/products/propeller-kit/1.jpg', alt: 'Finished balsa propeller with adjustable hub' }],
  notIncluded: ['Super glue (CA)', 'Hobby knife'],
  variants: [{ sku: 'PROP-KIT', label: 'Default', priceCents: 699 }],
  tags: ['propeller', 'balsa', 'hub'],
};
```

Verify nothing is left:

```bash
grep -n "specs\|included:" src/content/products/*.ts
```

Expected: no output.

- [ ] **Step 5: Replace the two components with `NeededList`**

```bash
git rm -q src/components/product/SpecTable.tsx src/components/product/IncludedList.tsx
```

Create `src/components/product/NeededList.tsx`:

```tsx
import { X } from 'lucide-react';

export function NeededList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">You will need</h2>
      <ul className="space-y-1 text-sm">
        {items.map((s) => (
          <li key={s} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{s}</li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Update the product page**

In `src/app/products/[slug]/page.tsx`:
- Replace the two imports `IncludedList` and `SpecTable` with `import { NeededList } from '@/components/product/NeededList';` (keep imports alphabetical: Description, Downloads, Gallery, NeededList, PurchasePanel).
- Replace the bottom block:

```tsx
      <div className="mt-12 space-y-10">
        <NeededList items={product.notIncluded} />
        <Downloads downloads={product.downloads} />
      </div>
```

- [ ] **Step 7: Verify**

```bash
npm run lint && npx tsc --noEmit && npm test -- --run
```

Expected: no lint or type errors (the only former consumers of `specs` were the home compare table, removed in Task 1, and `SpecTable`); all tests pass including the updated schema test.

- [ ] **Step 8: Commit**

```bash
git add -A src/lib/catalog/schema.ts src/components/product src/app/products src/content/products src/test/catalog-schema.test.ts
git commit -m "Product page: remove Specifications and In-the-box sections

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Rename Advanced → Elliptical and Intermediate → Classic

**Files:**
- Rename: `src/content/products/advanced-kit.ts` → `elliptical-kit.ts`; `intermediate-kit.ts` → `classic-kit.ts`
- Rename: `public/images/products/advanced-kit/` → `elliptical-kit/`; `intermediate-kit/` → `classic-kit/`
- Modify: `src/content/products/index.ts`
- Modify: `scripts/prepare-images.mjs:11-19`
- Modify: `README.md:46`
- Test: `src/test/catalog-content.test.ts`, `src/test/paypal-order.test.ts`, `src/test/cart-store.test.ts`, `src/test/pricing.test.ts`

**Interfaces:**
- Produces: exports `ellipticalKit` and `classicKit` (`ProductInput`); slugs `elliptical-kit`, `classic-kit`; SKUs `ELL-KIT`, `CLS-KIT`. Tasks 4, 6, 7 use these.

- [ ] **Step 1: Update the content tests to the new identifiers**

In `src/test/catalog-content.test.ts` replace the first two tests with:

```ts
  it('has the five launch products', () => {
    expect(products.map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-kit',
      'custom-propeller',
      'elliptical-kit',
      'propeller-kit',
    ]);
  });

  it('kits carry the renamed display names', () => {
    expect(products.find((p) => p.slug === 'elliptical-kit')?.name).toBe('Elliptical Kit');
    expect(products.find((p) => p.slug === 'classic-kit')?.name).toBe('Classic Kit');
    const text = products
      .map((p) => [p.name, p.summary, p.description, ...p.tags, ...p.images.map((i) => i.alt)].join(' '))
      .join(' ');
    expect(text).not.toMatch(/advanced|intermediate/i);
  });

  it('prices match inventory/kits.txt', () => {
    expect(getVariant('ELL-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('CLS-KIT')?.variant.priceCents).toBe(7599);
    expect(getVariant('BEG-KIT')?.variant.priceCents).toBe(4999);
    expect(getVariant('PROP-KIT')?.variant.priceCents).toBe(699);
    expect(getVariant('CPROP-2')?.variant.priceCents).toBe(1299);
    expect(getVariant('CPROP-6')?.variant.priceCents).toBe(2899);
  });
```

and the last test with:

```ts
  it('three kits are featured', () => {
    expect(products.filter((p) => p.featured).map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-kit',
      'elliptical-kit',
    ]);
  });
```

Then swap the SKU and name in the other tests mechanically:

```bash
sed -i '' 's/ADV-KIT/ELL-KIT/g; s/INT-KIT/CLS-KIT/g; s/Advanced Kit/Elliptical Kit/g' src/test/paypal-order.test.ts src/test/cart-store.test.ts src/test/pricing.test.ts
grep -rn "ADV-KIT\|INT-KIT\|Advanced\|Intermediate" src/test
```

Expected grep: no output.

- [ ] **Step 2: Run the tests to see them fail**

```bash
npm test -- --run
```

Expected: `catalog-content`, `paypal-order`, `cart-store`, `pricing` fail (unknown SKU `ELL-KIT`, slug mismatch).

- [ ] **Step 3: Move the files and image folders**

```bash
git mv src/content/products/advanced-kit.ts src/content/products/elliptical-kit.ts
git mv src/content/products/intermediate-kit.ts src/content/products/classic-kit.ts
git mv public/images/products/advanced-kit public/images/products/elliptical-kit
git mv public/images/products/intermediate-kit public/images/products/classic-kit
```

- [ ] **Step 4: Rewrite `src/content/products/elliptical-kit.ts`**

(`specs`/`included` were removed in Task 2; copy edits come in Task 4 — this task only renames.)

```ts
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
```

- [ ] **Step 5: Rewrite `src/content/products/classic-kit.ts`**

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const classicKit: ProductInput = {
  slug: 'classic-kit',
  name: 'Classic Kit',
  category: 'kits',
  featured: true,
  summary: 'Highly competitive Division C 2027 flyer. Builds 2 planes. Mylar and carbon construction.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed to be highly competitive. Each kit has enough to build 2 planes.

Built around laser-cut balsa, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs that let you tune blade pitch.

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
```

- [ ] **Step 6: Update the index, image script, and README**

`src/content/products/index.ts`:

```ts
import type { ProductInput } from '@/lib/catalog/schema';
import { beginnerKit } from './beginner-kit';
import { classicKit } from './classic-kit';
import { customPropeller } from './custom-propeller';
import { ellipticalKit } from './elliptical-kit';
import { propellerKit } from './propeller-kit';

export const rawProducts: ProductInput[] = [beginnerKit, classicKit, ellipticalKit, propellerKit, customPropeller];
```

`scripts/prepare-images.mjs` — in `MAP`, replace the slug column: every `'advanced-kit'` → `'elliptical-kit'`, every `'intermediate-kit'` → `'classic-kit'` (9 entries; source filenames unchanged).

`README.md:46` — change `/products/advanced-kit/` → `/products/elliptical-kit/`.

- [ ] **Step 7: Verify**

```bash
grep -rn -i "advanced\|intermediate" src e2e scripts README.md
npm run lint && npm test -- --run && npm run build
```

Expected: grep prints nothing; lint, tests, and build pass; `out/products/elliptical-kit/index.html` and `out/products/classic-kit/index.html` exist.

- [ ] **Step 8: Commit**

```bash
git add -A src/content/products src/test public/images/products scripts/prepare-images.mjs README.md
git commit -m "Rename Advanced Kit to Elliptical Kit and Intermediate Kit to Classic Kit

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Update kit copy (PVC propeller, no "3+ minutes")

**Files:**
- Modify: `src/content/products/beginner-kit.ts`
- Modify: `src/content/products/elliptical-kit.ts`
- Modify: `src/content/products/classic-kit.ts`
- Test: `src/test/catalog-content.test.ts`

**Interfaces:**
- Consumes: slugs from Task 3.

- [ ] **Step 1: Add copy assertions**

Append inside the `describe('catalog content')` block in `src/test/catalog-content.test.ts`:

```ts
  it('kit copy matches the October 2026 change list', () => {
    const by = (slug: string) => products.find((p) => p.slug === slug)!;
    const elliptical = by('elliptical-kit');
    const classic = by('classic-kit');
    const beginner = by('beginner-kit');

    expect(`${elliptical.summary} ${elliptical.description}`).not.toMatch(/3\+/);
    for (const kit of [elliptical, classic]) {
      expect(kit.description).toContain('materials to build 2 balsa wood propellers');
      expect(kit.description).toContain('ready-to-use 24 cm PVC propeller');
    }
    expect(beginner.description).toContain('ready-to-use 24 cm PVC propeller');
    const beginnerText = [beginner.summary, beginner.description, ...beginner.tags, ...beginner.images.map((i) => i.alt)].join(' ');
    expect(beginnerText).not.toMatch(/ikara/i);
  });
```

- [ ] **Step 2: Run to see it fail**

```bash
npm test -- --run src/test/catalog-content.test.ts
```

Expected: FAIL on the `3\+` assertion.

- [ ] **Step 3: Edit `src/content/products/elliptical-kit.ts`**

Replace `summary` and the first two description paragraphs:

```ts
  summary: 'Max-duration Division C 2027 flyer with an elliptical wing. Builds 2 planes.',
  description: `This kit complies with Division C 2027 Science Olympiad rules and is designed for maximum possible flight time. Each kit has enough to build 2 planes.

Built around laser-cut balsa and plywood parts, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs to tune blade pitch, plus one ready-to-use 24 cm PVC propeller.

Step-by-step instructions cover assembly, motor making, winding tips, and trimming.`,
```

- [ ] **Step 4: Edit `src/content/products/classic-kit.ts`**

Replace the second description paragraph with:

```
Built around laser-cut balsa, carbon fiber rods, and lightweight Mylar covering. Includes materials to build 2 balsa wood propellers, with adjustable propeller hubs that let you tune blade pitch, plus one ready-to-use 24 cm PVC propeller.
```

- [ ] **Step 5: Edit `src/content/products/beginner-kit.ts`**

- Second description paragraph:

```
While slightly heavier (about 9.5 g), it is built to be robust with laser-cut balsa, plywood parts, and tissue covering. Comes with a ready-to-use 24 cm PVC propeller.
```

- Third image alt: `'Beginner Kit built plane with PVC propeller'`.
- Tags: `['science olympiad', 'division c', 'tissue', 'beginner', 'pvc']`.

- [ ] **Step 6: Run the tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/content/products src/test/catalog-content.test.ts
git commit -m "Kits: PVC propeller wording, drop 3+ minute claim

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Rewrite the About page

**Files:**
- Modify: `src/app/about/page.tsx`
- Test: `e2e/smoke.spec.ts`

- [ ] **Step 1: Add an e2e check**

Append to `e2e/smoke.spec.ts`:

```ts
test('about page carries the rewritten description', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByText(/designs and sells laser-cut rubber-powered indoor free-flight kits/i)).toBeVisible();
  await expect(page.getByText(/placed 1st at the MIT Science Olympiad Invitational in the 2025 and 2026 seasons/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'soinc.org' })).toHaveAttribute('href', 'https://www.soinc.org/');
  await expect(page.getByText(/2nd place/i)).toHaveCount(0);
});
```

- [ ] **Step 2: Rewrite `src/app/about/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">About {site.name}</h1>
      <p>
        {site.name} designs and sells laser-cut rubber-powered indoor free-flight kits for Science Olympiad competitors. Each kit includes enough parts to build two airplanes, along with step-by-step building instructions and guidance for flight testing and trimming.
      </p>
      <p>
        Every model was designed by an alumni Science Olympiad competitor who placed 1st at the MIT Science Olympiad Invitational in the 2025 and 2026 seasons.
      </p>
      <p>
        Kits are designed to the Division C 2027 Flight rules. Read the current rules and event details at{' '}
        <a className="underline" href="https://www.soinc.org/" target="_blank" rel="noopener noreferrer">
          soinc.org
        </a>
        .
      </p>
      <p>
        Questions or custom requests? Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Build and run e2e**

```bash
npm run build && npx playwright test
```

Expected: 4 e2e tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx e2e/smoke.spec.ts
git commit -m "About: use the owner's rewritten description

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Swap in the re-rendered kit images

**Files:**
- Modify: `scripts/prepare-images.mjs`
- Modify: `src/components/catalog/ProductCard.tsx:17`
- Regenerate: `public/images/products/{beginner-kit,classic-kit,elliptical-kit}/render.png`
- Create (generated): `public/images/products/classic-elliptical-package/render.png` (consumed by Task 7)

**Interfaces:**
- Consumes: `inventory/renders/*.png` (staged, untracked).
- Produces: `npm run images -- render` regenerates only the render entries; package render at `/images/products/classic-elliptical-package/render.png`.

- [ ] **Step 1: Confirm the sources are present**

```bash
ls -la inventory/renders
```

Expected: `beginner.png`, `classic.png`, `elliptical.png`, `package.png`. If missing, re-export the Google Doc as a zip (`gws drive files export --params '{"fileId":"1EiHjVYuNF9tcx3whwEDMqMUKixAV1cspUfSTi6Cg5y0","mimeType":"application/zip"}'`; inside, `images/image4.png` = beginner, `image3.png` = elliptical, `image1.png` = classic) and fetch the Drive file for the package (`gws drive files get --params '{"fileId":"1dY3ai0noWrwCS0Why_2R9i-WfzEjQvKX","alt":"media"}'`).

- [ ] **Step 2: Rewrite `scripts/prepare-images.mjs`**

Adds the new render sources, flattens PNGs onto white (the renders are transparent), and accepts an optional basename filter so only renders are regenerated.

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'inventory';
const OUT = 'public/images/products';
const MAX = 1600;
// Optional: `npm run images -- render` regenerates only entries with that output basename.
const ONLY = process.argv[2];

// [source file, slug, output basename, kind]
const MAP = [
  ['renders/elliptical.png', 'elliptical-kit', 'render', 'png'],
  ['IMG_1511.JPG', 'elliptical-kit', '1', 'jpg'],
  ['IMG_1512.JPG', 'elliptical-kit', '2', 'jpg'],
  ['IMG_1513.JPG', 'elliptical-kit', '3', 'jpg'],
  ['IMG_1514.JPG', 'elliptical-kit', '4', 'jpg'],
  ['renders/classic.png', 'classic-kit', 'render', 'png'],
  ['IMG_1506.JPG', 'classic-kit', '1', 'jpg'],
  ['IMG_1508.JPG', 'classic-kit', '2', 'jpg'],
  ['IMG_1509.JPG', 'classic-kit', '3', 'jpg'],
  ['renders/beginner.png', 'beginner-kit', 'render', 'png'],
  ['IMG_1521.JPG', 'beginner-kit', '1', 'jpg'],
  ['IMG_1524.JPG', 'beginner-kit', '2', 'jpg'],
  ['renders/package.png', 'classic-elliptical-package', 'render', 'png'],
  ['IMG_1538.JPG', 'propeller-kit', '1', 'jpg'],
  ['IMG_1538.JPG', 'custom-propeller', '1', 'jpg'],
];

for (const [file, slug, base, kind] of MAP) {
  if (ONLY && base !== ONLY) continue;
  const dir = path.join(OUT, slug);
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `${base}.${kind}`);
  let img = sharp(path.join(SRC, file))
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  img = kind === 'png' ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 82, mozjpeg: true });
  const info = await img.toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
```

- [ ] **Step 3: Generate the renders**

```bash
npm run images -- render
file public/images/products/*/render.png
git status --short public/images
```

Expected: four lines printed, each ≤ ~400 KB; `file` shows 1600×843 (elliptical, classic), 1600×682 (beginner), 1048×826 (package); git shows the three kit renders modified and the package render untracked.

- [ ] **Step 4: Stop cropping renders on product cards**

In `src/components/catalog/ProductCard.tsx` (lines 16-17) change the image class from `object-cover` to `object-contain` (the Gallery already uses `object-contain`; the renders are wide and lose wingtips under `cover`) and the tile background from `bg-muted` to `bg-white` so the white-flattened renders don't sit as a white box on a grey tile:

```tsx
      <div className="relative aspect-[4/3] bg-white">
        <Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-contain" />
```

- [ ] **Step 5: Look at the result**

```bash
npm run build && (npx serve out -l 3000 --no-clipboard & sleep 2; open http://localhost:3000/; wait)
```

Check that the three featured cards show the new renders uncropped on a white tile, then Ctrl-C the server.

- [ ] **Step 6: Tests and commit**

```bash
npm test -- --run
git add scripts/prepare-images.mjs src/components/catalog/ProductCard.tsx public/images/products
git commit -m "Use re-rendered kit images; show renders uncropped on cards

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

Expected: tests pass (the `every image path exists` test still passes; the package image is unreferenced until Task 7).

---

### Task 7: Add the Classic + Elliptical Kit Package

**Files:**
- Create: `src/content/products/classic-elliptical-package.ts`
- Modify: `src/content/products/index.ts`
- Test: `src/test/catalog-content.test.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `/images/products/classic-elliptical-package/render.png` from Task 6.
- Produces: slug `classic-elliptical-package`, SKU `PKG-CLS-ELL`, export `classicEllipticalPackage`.

- [ ] **Step 1: Update tests for six products and four featured kits**

In `src/test/catalog-content.test.ts`:

```ts
  it('has the six products', () => {
    expect(products.map((p) => p.slug).sort()).toEqual([
      'beginner-kit',
      'classic-elliptical-package',
      'classic-kit',
      'custom-propeller',
      'elliptical-kit',
      'propeller-kit',
    ]);
  });
```

Add `expect(getVariant('PKG-CLS-ELL')?.variant.priceCents).toBe(8499);` to the prices test. Replace the featured test and add a package test:

```ts
  it('four kits are featured, package last', () => {
    expect(products.filter((p) => p.featured).map((p) => p.slug)).toEqual([
      'beginner-kit',
      'classic-kit',
      'elliptical-kit',
      'classic-elliptical-package',
    ]);
  });

  it('package copy matches the change list', () => {
    const pkg = products.find((p) => p.slug === 'classic-elliptical-package')!;
    expect(pkg.category).toBe('kits');
    expect(pkg.description).toContain('materials to build an Elliptical and Classic kit plane');
    expect(pkg.description).toContain('ready-to-use 24 cm PVC propeller');
    expect(pkg.images[0].src).toBe('/images/products/classic-elliptical-package/render.png');
    expect([pkg.name, pkg.summary, ...pkg.tags].join(' ')).not.toMatch(/mylar/i); // keeps the e2e "mylar" search at 2 results
  });
```

In `e2e/smoke.spec.ts` change the home card count to `6`:

```ts
  await expect(page.getByTestId('product-card')).toHaveCount(6);
```

- [ ] **Step 2: Run to see failures**

```bash
npm test -- --run src/test/catalog-content.test.ts
```

Expected: FAIL — slug list has 5 entries.

- [ ] **Step 3: Create `src/content/products/classic-elliptical-package.ts`**

```ts
import type { ProductInput } from '@/lib/catalog/schema';

export const classicEllipticalPackage: ProductInput = {
  slug: 'classic-elliptical-package',
  name: 'Classic + Elliptical Kit Package',
  category: 'kits',
  featured: true,
  summary: 'The Elliptical and Classic kits together. Both comply with Division C 2027 rules; includes propeller materials and instructions.',
  description: `This package comes with materials to build an Elliptical and Classic kit plane. Both comply with Division C 2027 Science Olympiad rules.

Comes with materials to build 2 propellers plus a ready-to-use 24 cm PVC propeller. Also includes step-by-step instructions covering assembly, motor making, winding tips, and trimming.`,
  images: [
    { src: '/images/products/classic-elliptical-package/render.png', alt: 'Elliptical Kit and Classic Kit renderings side by side' },
  ],
  notIncluded: ['Super glue (CA)', 'Hobby knife', 'Spray adhesive', 'Pliers', 'Winder'],
  variants: [{ sku: 'PKG-CLS-ELL', label: 'Default', priceCents: 8499 }],
  tags: ['science olympiad', 'division c', 'package', 'bundle', 'classic', 'elliptical'],
};
```

- [ ] **Step 4: Register it**

`src/content/products/index.ts`:

```ts
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
```

- [ ] **Step 5: Verify**

```bash
npm run lint && npm test -- --run && npm run build && npx playwright test
grep -c classic-elliptical-package out/sitemap.xml
```

Expected: all green; `out/products/classic-elliptical-package/index.html` exists; home shows 6 cards; grep prints `1`.

- [ ] **Step 6: Commit**

```bash
git add src/content/products src/test/catalog-content.test.ts e2e/smoke.spec.ts
git commit -m "Add Classic + Elliptical Kit Package at \$84.99

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Final sweep

**Files:**
- None expected; see Step 2 for the one owner-gated exception.

- [ ] **Step 1: Stale-reference sweep**

```bash
grep -rn -i "advanced\|intermediate\|ikara\|which kit\|images/brand\|3+ min\|SpecTable\|IncludedList" src e2e scripts README.md docs/PAYPAL_SETUP.md
```

Expected: no output. (Hits under `docs/superpowers/` are historical and stay.)

- [ ] **Step 2: Etsy listings — ask the owner before touching**

`marketing/etsy/` still says Advanced/Intermediate/Ikara and has no package listing. It is not in the owner's change list, so leave it unless the owner confirms. If they do: rename `advanced-kit.md`→`elliptical-kit.md` and `intermediate-kit.md`→`classic-kit.md`, apply the same wording as Task 4, add `classic-elliptical-package.md`, and update the table in `marketing/etsy/README.md`.

- [ ] **Step 3: Full verification from a clean tree**

```bash
git status --short
npm run lint && npm test -- --run && npm run build && npx playwright test
```

Expected: tree clean (only `inventory/` is untracked and ignored); everything green.

- [ ] **Step 4: Push (only when the owner asks)**

```bash
git push origin main
```
