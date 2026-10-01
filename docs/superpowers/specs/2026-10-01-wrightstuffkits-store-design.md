# Wright Stuff Kits — Static Store Design

Date: 2026-10-01
Status: Approved design, pending implementation plan
Domain: wrightstuffkits.com

## 1. Goal

A static e-commerce site selling Science Olympiad free-flight kits and
propeller supplies. Built with Next.js (App Router, TypeScript), exported as
static HTML, hosted free on GitHub Pages, with checkout handled entirely in the
browser by the PayPal JS SDK. No backend, no database, no secrets at runtime.

## 2. Decisions

| Topic | Decision |
|---|---|
| Framework | Next.js 15 App Router, TypeScript, `output: 'export'` |
| Styling | Tailwind CSS + shadcn/ui (Radix) + Lucide icons |
| Hosting | GitHub Pages via GitHub Actions on push to `main`, custom domain |
| Payments | `@paypal/react-paypal-js` Smart Buttons, client-side `createOrder` + `capture` |
| Shipping | Buyer picks from site-defined options inside the PayPal popup (`shipping.options`); US only |
| Tax | Not computed on site; configure in PayPal merchant account if required |
| Post-order | PayPal emails buyer and seller; site shows confirmation and clears cart |
| Catalog source | Typed TS files under `src/content/products`, Zod-validated at build |
| Options | Variants with their own SKU + price (`inStock` flag per variant) |
| Search | Client-side filter over catalog JSON, URL-synced (`?q=&cat=`) |
| Inventory | Manual `inStock` flag; no live stock |
| State | Zustand + `persist` (localStorage) |
| Testing | Vitest unit tests + one Playwright smoke; PayPal verified manually in sandbox |
| Initial catalog | The 5 products in `inventory/kits.txt`; categories `kits`, `propellers` |
| Contact email | Single placeholder in `src/content/site.ts`, replaced before launch |

### Security trade-off (accepted)

With no server, order amounts are built in the browser. A buyer could edit
prices in devtools before `createOrder`. Mitigation: every PayPal order carries
line items with SKU and unit price, so the seller verifies the PayPal receipt
against the catalog before shipping. `src/lib/paypal/order.ts` is the single
place that builds the order so a serverless verifier (e.g. Cloudflare Worker)
can replace it later without touching UI code.

## 3. Initial catalog

From `inventory/kits.txt`. Images mapped by content.

| Slug | Name | Category | Variants (sku → cents) | Images |
|---|---|---|---|---|
| `advanced-kit` | Advanced Kit | kits | `ADV-KIT` → 7599 | advanced.PNG (render), IMG_1511, 1512, 1513, 1514 |
| `intermediate-kit` | Intermediate Kit | kits | `INT-KIT` → 7599 | Intermediate_Kit_…png (render), IMG_1506, 1508, 1509 |
| `beginner-kit` | Beginner Kit | kits | `BEG-KIT` → 4999 | beginner.PNG (render), IMG_1521, 1524 |
| `propeller-kit` | Propeller Kit | propellers | `PROP-KIT` → 699 | IMG_1538 |
| `custom-propeller` | Custom Laser-cut Propeller | propellers | `CPROP-2` → 1299, `CPROP-3` → 1699, `CPROP-4` → 2099, `CPROP-5` → 2499, `CPROP-6` → 2899 | IMG_1538 |

Shared facts for the three kits: Division C 2027 Science Olympiad rules
compliant, builds 2 planes, 1/8" FAI rubber, O-rings, step-by-step
instructions. Tools not included: CA glue, hobby knife, spray adhesive, pliers,
winder. Beginner is ~9.5 g, tissue covering, single Ikara 24 cm prop.
Advanced/Intermediate use Mylar, carbon rods, 2 buildable balsa props with
adjustable-pitch hubs and jig. Advanced adds plywood parts and is designed for
3+ minute flights.

Custom propeller `postPurchaseNote`: "Email your design (DXF preferred, or any
image plus a size) and your PayPal order ID to {contactEmail}."

The `inventory/` folder stays in the repo as raw source material and is not
part of the build. Images are copied into `public/images/products/<slug>/`,
resized to a 1600 px long edge and kept under ~400 KB each (JPEG for photos,
PNG for renders), since `images.unoptimized` serves files as-is.

## 4. Repository layout

```
wrightstuffkits/
├── .github/workflows/deploy.yml
├── next.config.mjs
├── package.json  tsconfig.json  tailwind.config.ts  components.json
├── vitest.config.ts  playwright.config.ts
├── .env.example                      # NEXT_PUBLIC_PAYPAL_CLIENT_ID=sb-...
├── public/
│   ├── CNAME                         # wrightstuffkits.com
│   ├── .nojekyll
│   ├── images/products/<slug>/*.jpg
│   ├── images/brand/logo.svg
│   └── docs/<slug>/*.pdf             # assembly manuals, tuning guides
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Header, CartDrawer, Footer, PayPalProvider
│   │   ├── page.tsx                  # Home
│   │   ├── products/page.tsx         # Catalog + search/filter
│   │   ├── products/[slug]/page.tsx  # Product detail (generateStaticParams)
│   │   ├── checkout/page.tsx         # Full-page cart + PayPal buttons
│   │   ├── order/confirmed/page.tsx  # Reads order from sessionStorage
│   │   ├── about/page.tsx  faq/page.tsx  contact/page.tsx
│   │   ├── not-found.tsx  sitemap.ts  robots.ts
│   │   └── globals.css
│   ├── content/
│   │   ├── products/advanced-kit.ts  intermediate-kit.ts  beginner-kit.ts
│   │   │            propeller-kit.ts  custom-propeller.ts  index.ts
│   │   ├── site.ts                   # name, contactEmail, shippingOptions, usOnly, paypalClientId
│   │   └── faq.ts
│   ├── lib/
│   │   ├── catalog/schema.ts         # Zod schemas + inferred types
│   │   ├── catalog/index.ts          # validated catalog, getProduct, getVariant, filterProducts
│   │   ├── cart/store.ts             # Zustand store with persist
│   │   ├── cart/pricing.ts           # pure money math (integer cents)
│   │   ├── cart/resolve.ts           # CartItem[] → CartLine[] (joined with catalog)
│   │   ├── paypal/order.ts           # CartLine[] + shipping → CreateOrderRequestBody
│   │   ├── paypal/types.ts
│   │   └── format.ts                 # formatCents
│   ├── components/
│   │   ├── ui/                       # shadcn: button, sheet, dialog, select, badge, input, separator, sonner
│   │   ├── layout/Header.tsx  Footer.tsx  MobileNav.tsx  CartTrigger.tsx
│   │   ├── catalog/ProductCard.tsx  ProductGrid.tsx  CategoryFilter.tsx  SearchBox.tsx  CatalogView.tsx
│   │   ├── product/Gallery.tsx  SpecTable.tsx  VariantSelector.tsx  IncludedList.tsx
│   │   │            Downloads.tsx  PurchasePanel.tsx
│   │   ├── cart/CartDrawer.tsx  CartLine.tsx  CartSummary.tsx  ShippingNote.tsx
│   │   └── checkout/PayPalProvider.tsx  PayPalCheckout.tsx  OrderConfirmation.tsx
│   └── test/                         # vitest: pricing, order, store, catalog
├── e2e/smoke.spec.ts
├── inventory/                        # raw source, not built
└── docs/superpowers/specs/
```

## 5. Data model

```ts
// src/lib/catalog/schema.ts
export const CategorySchema = z.enum(['kits', 'propellers']);

export const VariantSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  label: z.string(),            // "Default", "2 sets", "1/8\" rubber"
  priceCents: z.number().int().positive(),
  inStock: z.boolean().default(true),
});

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  category: CategorySchema,
  summary: z.string().max(200),
  description: z.string(),      // markdown
  images: z.array(z.object({ src: z.string(), alt: z.string() })).min(1),
  specs: z.record(z.string()).default({}),   // "Wingspan" → "…", "Target weight" → "…"
  included: z.array(z.string()).default([]),
  notIncluded: z.array(z.string()).default([]),
  downloads: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  variants: z.array(VariantSchema).min(1),
  optionLabel: z.string().optional(),        // "Number of sets"; hidden when 1 variant
  featured: z.boolean().default(false),
  postPurchaseNote: z.string().optional(),
  tags: z.array(z.string()).default([]),     // searched alongside name/summary
});
```

- `CartItem = { sku: string; qty: number }` is the only thing persisted.
- `CartLine = CartItem & { product; variant; lineTotalCents }` is derived at
  render time from the catalog, so stale localStorage cannot carry old prices
  or names. Unknown SKUs are pruned on hydrate.
- All money is integer cents. `formatCents(7599) === '$75.99'`.
- Catalog loader asserts unique slugs, unique SKUs across all products, and
  that every `images[].src` and `downloads[].href` exists under `public/`.
  Failures fail `next build`.

## 6. Cart

Zustand store, `persist` middleware, storage key `wsk-cart-v1`.

```ts
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  add(sku: string, qty?: number): void;   // merges into existing line
  setQty(sku: string, qty: number): void; // qty <= 0 removes
  remove(sku: string): void;
  clear(): void;
  open(): void; close(): void;
  setHydrated(): void;
}
```

- Components render cart-dependent UI only after `hasHydrated` to avoid SSG
  hydration mismatches; the cart badge renders `0` until then.
- **Add to Cart**: `add(variant.sku, qty)` then `open()`.
- **Buy Now with PayPal**: `clear()`, `add()`, `router.push('/checkout')`.
- Sold-out variants disable both buttons and show a "Sold out" badge.
- Drawer (shadcn `Sheet`, right side): lines with qty stepper and remove,
  subtotal, "Shipping and any tax are selected in PayPal" note, PayPal
  buttons, link to `/checkout`.

## 7. PayPal integration

Package: `@paypal/react-paypal-js`. SDK options:
`{ clientId, currency: 'USD', intent: 'capture', components: 'buttons' }`.
`PayPalScriptProvider` is mounted in the root layout with `deferLoading: true`;
`PayPalCheckout` dispatches the load action on first mount so the SDK script
is only fetched once a buyer opens the drawer or checkout page.

### Site config

```ts
// src/content/site.ts
export const site = {
  name: 'Wright Stuff Kits',
  domain: 'wrightstuffkits.com',
  contactEmail: 'orders@wrightstuffkits.com', // placeholder; replace before launch
  usOnly: true,
  shippingOptions: [
    { id: 'usps-ground', label: 'USPS Ground Advantage', amountCents: 650, selected: true },
    { id: 'usps-priority', label: 'USPS Priority Mail', amountCents: 1050, selected: false },
  ],
  paypalClientId: requireEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID'),
} as const;
```

`requireEnv` throws at build time when the variable is missing, so a deploy
without a client ID cannot succeed. Shipping amounts above are starting
values; the owner sets real rates before launch.

### Order builder (the swap point)

```ts
// src/lib/paypal/order.ts
export function buildOrder(lines: CartLine[], shippingId: string): CreateOrderRequestBody {
  const itemTotal = subtotalCents(lines);
  const shipping = site.shippingOptions.find(o => o.id === shippingId)!;
  const usd = (c: number) => ({ currency_code: 'USD', value: (c / 100).toFixed(2) });
  return {
    intent: 'CAPTURE',
    purchase_units: [{
      custom_id: lines.map(l => `${l.sku}x${l.qty}`).join(','),
      items: lines.map(l => ({
        name: `${l.product.name}${l.product.variants.length > 1 ? ` – ${l.variant.label}` : ''}`,
        sku: l.sku,
        quantity: String(l.qty),
        unit_amount: usd(l.variant.priceCents),
        category: 'PHYSICAL_GOODS',
      })),
      amount: {
        ...usd(itemTotal + shipping.amountCents),
        breakdown: { item_total: usd(itemTotal), shipping: usd(shipping.amountCents) },
      },
      shipping: {
        options: site.shippingOptions.map(o => ({
          id: o.id, label: o.label, type: 'SHIPPING', selected: o.id === shippingId,
          amount: usd(o.amountCents),
        })),
      },
    }],
    application_context: { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
  };
}
```

### Buttons component

```tsx
// src/components/checkout/PayPalCheckout.tsx
'use client';
export function PayPalCheckout() {
  const lines = useCartLines();
  const clear = useCart(s => s.clear);
  const router = useRouter();
  const shippingRef = useRef(site.shippingOptions.find(o => o.selected)!.id);

  if (lines.length === 0) return null;

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect' }}
      forceReRender={[lines]}
      createOrder={(_, actions) => actions.order.create(buildOrder(lines, shippingRef.current))}
      onShippingOptionsChange={async (data, actions) => {
        shippingRef.current = data.selectedShippingOption.id;
        const next = buildOrder(lines, shippingRef.current).purchase_units[0].amount;
        return actions.order.patch([{ op: 'replace', path: "/purchase_units/@reference_id=='default'/amount", value: next }]);
      }}
      onShippingAddressChange={(data, actions) => {
        if (site.usOnly && data.shippingAddress.countryCode !== 'US') return actions.reject();
        return Promise.resolve();
      }}
      onApprove={async (data, actions) => {
        const details = await actions.order!.capture();
        const status = details.purchase_units?.[0]?.payments?.captures?.[0]?.status;
        if (status === 'DECLINED' || details.details?.[0]?.issue === 'INSTRUMENT_DECLINED') {
          return actions.restart();
        }
        sessionStorage.setItem('wsk-last-order', JSON.stringify(summarize(details, lines)));
        clear();
        router.push('/order/confirmed');
      }}
      onError={() => toast.error('PayPal could not complete the payment. Your cart is unchanged.')}
      onCancel={() => { /* no-op; cart intact */ }}
    />
  );
}
```

### Confirmation page

Reads `wsk-last-order` from sessionStorage. Shows order ID, capture ID,
payer email, lines, shipping method and total, "PayPal has emailed your
receipt". For any line whose product has `postPurchaseNote`, renders that note
with `{contactEmail}` substituted. With no stored order, shows "No recent
order found" and a link to the catalog.

### Error handling summary

| Case | Behavior |
|---|---|
| `onError` / capture throws | Toast + inline message in drawer; cart intact |
| `onCancel` | Popup closes, nothing changes |
| `INSTRUMENT_DECLINED` | `actions.restart()` so buyer picks another funding source |
| Non-US address | `actions.reject()` → PayPal shows "cannot ship to this address" |
| Missing client ID | Build fails |
| Invalid product file | Build fails with Zod error naming the file |
| Stale SKU in localStorage | Pruned silently on hydrate |

### Environments

- `.env.local` (gitignored): sandbox client ID for `next dev`.
- GitHub Actions: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` from repository secret
  `PAYPAL_CLIENT_ID` (live). No PayPal secret key exists anywhere; capture is
  client-side.

## 8. Pages

- **Home** `/`: hero, three featured kits (Beginner / Intermediate / Advanced)
  with a compare strip (weight, covering, prop, target flight), propeller
  products row, "Science Olympiad Division C 2027 compliant" callout.
- **Catalog** `/products`: `CatalogView` (client) with `SearchBox` and
  `CategoryFilter`, state mirrored to `?q=&cat=`; filters over
  `name + summary + tags`, case-insensitive substring.
- **Product** `/products/[slug]`: `Gallery` (render first, then photos),
  name/price (price follows selected variant), `VariantSelector` (shadcn
  Select, hidden when one variant), qty stepper, `PurchasePanel` (Add to Cart,
  Buy Now with PayPal), `SpecTable`, `IncludedList` (included vs tools not
  included), markdown description, `Downloads` (PDF list; section hidden when
  empty).
- **Checkout** `/checkout`: full cart table, summary, shipping note, PayPal
  buttons. Empty cart → message and link.
- **Order confirmed** `/order/confirmed`: see §7.
- **About**, **FAQ** (shipping, returns, rules compliance, custom prop
  process; from `faq.ts`), **Contact** (mailto + note on custom designs).
- `sitemap.ts`, `robots.ts`, per-page `metadata`, Product JSON-LD on detail
  pages.

## 9. Build and deploy

`next.config.mjs`:

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

No `basePath`/`assetPrefix` because the site is served from the custom domain
root. `public/CNAME` contains `wrightstuffkits.com`; `public/.nojekyll` stops
Pages from ignoring `_next/`.

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
        env:
          NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${{ secrets.PAYPAL_CLIENT_ID }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: out }
  deploy:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Repository settings: Pages → Source: GitHub Actions; custom domain
`wrightstuffkits.com`; Enforce HTTPS.

## 10. Testing

Vitest (`src/test/`):
- `pricing.test.ts`: line totals, subtotal, zero/empty, no float drift.
- `order.test.ts`: payload shape; `item_total` equals sum of items; amount
  equals items + shipping; selected shipping flag; variant label appended only
  for multi-variant products; `custom_id` encoding.
- `store.test.ts`: add merges, setQty 0 removes, clear, persistence round-trip
  via mocked storage, stale SKU pruning.
- `catalog.test.ts`: every product file validates; unique slugs/SKUs; all
  image and download paths exist.

Playwright (`e2e/smoke.spec.ts`) against `next build && npx serve out`:
home renders featured kits → catalog search narrows results → product page
shows variant selector for custom propeller → add to cart opens drawer with
correct subtotal → reload keeps the cart → PayPal button container is present.
PayPal popup is not automated.

Manual sandbox checklist is in §12; PayPal account configuration is in §13.

## 11. Phases

1. **Scaffold and deploy**: `create-next-app`, Tailwind, shadcn init, static
   export config, CI workflow, placeholder page live on `*.github.io`,
   `docs/PAYPAL_SETUP.md` (§13). Proves the pipeline before features exist.
2. **Catalog**: schema, loader, 5 product files, images resized into
   `public/`, catalog tests.
3. **Pages**: layout, header/footer, home, catalog with search/filter, product
   detail.
4. **Cart**: store, pricing, drawer, Buy Now, store/pricing tests, Playwright
   smoke.
5. **Checkout**: PayPal provider, order builder + tests, buttons in drawer and
   checkout page, confirmation page, sandbox verification.
6. **Content and launch**: about/faq/contact, SEO, custom domain DNS, live
   client ID, contact email, live test order.

## 12. Launch checklist

PayPal sandbox (developer.paypal.com → sandbox business + personal accounts):
- [ ] Buy each kit, the propeller kit, and a 4-set custom propeller in one order; receipt lists each SKU and price.
- [ ] Change shipping option inside PayPal; total updates; capture total matches.
- [ ] Enter a non-US address; PayPal refuses it.
- [ ] Use the sandbox `INSTRUMENT_DECLINED` negative-testing trigger; buttons restart.
- [ ] Cancel the popup; cart unchanged.
- [ ] Confirmation page shows order ID and custom-prop email instructions; cart badge is 0; reload keeps it empty.
- [ ] Seller sandbox email shows shipping address and line items.

Go-live:
- [ ] Replace `contactEmail` placeholder in `site.ts`; set real shipping rates.
- [ ] Add live client ID as repo secret `PAYPAL_CLIENT_ID`; redeploy.
- [ ] DNS: `A` records for `wrightstuffkits.com` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; `CNAME www` → `<user>.github.io`.
- [ ] Pages settings: custom domain set, DNS check passes, Enforce HTTPS on.
- [ ] Live order for the cheapest item from a second PayPal account, then refund.
- [ ] Lighthouse: performance ≥ 90 mobile on home and a product page; no console errors.
- [ ] `robots.txt` and `sitemap.xml` reachable; Product JSON-LD validates.

## 13. PayPal setup guide (`docs/PAYPAL_SETUP.md`)

Phase 1 adds a standalone, owner-facing document at `docs/PAYPAL_SETUP.md`
that walks through every PayPal-side setting the site depends on. It is
written for a non-developer and is linked from the README. Contents:

1. **Accounts**
   - Create or upgrade to a PayPal **Business** account for Wright Stuff Kits.
   - Sign in at developer.paypal.com with that account.
2. **Sandbox for testing**
   - Developer Dashboard → Testing Tools → Sandbox Accounts: note the
     auto-created Business (seller) and Personal (buyer) accounts, reset
     their passwords.
   - Apps & Credentials → **Sandbox** tab → Create App ("Wright Stuff Kits
     Sandbox", Merchant type). Copy the **Client ID** only; the Secret is never
     used by this site.
   - Put it in `.env.local` as `NEXT_PUBLIC_PAYPAL_CLIENT_ID=<sandbox id>`.
   - How to log in to sandbox.paypal.com as the buyer, and where to see
     orders as the seller.
   - Negative testing: enable it on the sandbox app and the test card /
     memo values that trigger `INSTRUMENT_DECLINED`.
3. **Live credentials**
   - Apps & Credentials → **Live** tab → Create App ("Wright Stuff Kits").
     Copy the Client ID.
   - GitHub → repo Settings → Secrets and variables → Actions → New secret
     `PAYPAL_CLIENT_ID` = live Client ID. Re-run the deploy workflow.
4. **App features**
   - In the app settings keep only "Accept payments" enabled; no Vault, no
     Log in with PayPal.
5. **Merchant account settings** (paypal.com → Account Settings)
   - Website payments → Website preferences: Auto return off (not used),
     block payments from users who do not have a confirmed address: owner's
     choice; PDT not needed.
   - Shipping: do **not** configure shipping rules in PayPal; the site passes
     shipping options in each order. PayPal profile shipping rules would
     double-charge.
   - Sales tax: if the owner must collect tax, set it here by state; the site
     does not compute tax.
   - Notifications: confirm seller "payment received" emails are on, since
     these emails are the order record.
   - Business information: display name, customer service email and phone
     shown on buyer receipts.
   - Currency: USD primary.
6. **Address verification**
   - Explain that the site rejects non-US addresses in the PayPal popup and
     that no PayPal-side setting is required for this.
7. **Verifying an order before shipping**
   - Open the transaction in PayPal, compare item SKUs and unit prices in the
     receipt against `src/content/products/*.ts`, check the shipping method
     and address. Refund if anything was tampered with.
8. **Refunds and disputes**
   - Where to issue full or partial refunds; Seller Protection requirements
     (ship to the address on the transaction, keep tracking).
9. **Rotating or revoking a Client ID**
   - Create a new app, update the GitHub secret, redeploy, then delete the old
     app.

The guide includes screenshots placeholders as numbered steps only (no
images committed) and a short "Checklist before first live sale" that
mirrors §12.

## 14. Out of scope

Accounts, order history, live inventory, discount codes, tax calculation,
server-side price verification, non-US shipping, CMS, analytics (can be added
as a script tag later).
