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
