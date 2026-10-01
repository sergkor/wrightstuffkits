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

## Launch runbook

1. Set `contactEmail` and `shippingOptions` in `src/content/site.ts`.
2. Add the live PayPal Client ID as the `PAYPAL_CLIENT_ID` repository secret (see `docs/PAYPAL_SETUP.md`).
3. Point DNS at GitHub Pages and enable HTTPS (Settings → Pages).
4. Push to `main`; the workflow builds, tests, and deploys.

### Before first live sale

- [ ] Sandbox: buy each kit, the propeller kit, and a 4-set custom propeller in one order; receipt lists each SKU and unit price.
- [ ] Sandbox: change the shipping option inside PayPal; the total updates and the captured total matches.
- [ ] Sandbox: a non-US address is refused.
- [ ] Sandbox: negative-testing `INSTRUMENT_DECLINED` restarts the buttons with an inline error.
- [ ] Sandbox: cancelling the popup leaves the cart unchanged.
- [ ] Confirmation page shows the order ID and the custom-propeller email note; the cart badge is 0 after reload.
- [ ] Live: one purchase of the Propeller Kit from a second PayPal account, then refund it.
- [ ] Lighthouse mobile Performance ≥ 90 on `/` and `/products/advanced-kit/`; no console errors.
- [ ] `https://wrightstuffkits.com/robots.txt` and `/sitemap.xml` load; a product URL validates at https://validator.schema.org.
- [ ] If you change `shippingOptions` rates, update the expected `6.50`/`10.50` strings in `src/test/paypal-order.test.ts` in the same commit.
