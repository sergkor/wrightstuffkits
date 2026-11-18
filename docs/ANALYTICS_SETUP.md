# Google Analytics 4 setup for Wright Stuff Kits

This site has no server. GA4 runs entirely in the visitor's browser, loaded by
`@next/third-parties/google` from `src/app/layout.tsx`. All you need is a **Measurement ID**
(`G-XXXXXXXXXX`), which is public — it appears in the page source of every deployed page, so it is a
repository *variable*, not a secret.

If the ID is unset the tag is not rendered at all. That is deliberate: local `npm run dev` and PR
builds never reach the production property.

> Google moves these menus around. The **bolded** words are the labels to look for; if a path differs
> from what you see, search for the bolded term in GA4's Admin area.

## 1. Create the account and property

1. Go to https://analytics.google.com and sign in with the Google account that should own this data.
   Pick one you will keep long-term — moving a property between accounts later is awkward.
2. No GA account yet → **Start measuring**. Already have one → gear icon **Admin** (bottom-left) →
   **Create** → **Property**.
3. Account name: `Wright Stuff Kits`. Leave the data-sharing checkboxes at their defaults.
4. Property name: `Wright Stuff Kits`. Set the **reporting time zone** to your own US zone and the
   **currency** to **US Dollar (USD)**. Currency matters: every event this site sends is tagged
   `currency: "USD"`, and a mismatched property currency silently converts your revenue numbers.
5. Business details: pick any reasonable industry category and size.
6. Business objectives: choose **Drive online sales**. This is what makes the ecommerce
   (Monetization) reports appear, which is where `purchase` revenue shows up.
7. Accept the Terms of Service for your country.

## 2. Create the web data stream

1. Platform: **Web**.
2. **Website URL**: `https://wrightstuffkits.com` · **Stream name**: `wrightstuffkits.com production`.
3. Leave **Enhanced measurement** ON. Expand it and confirm **Page changes based on browser history
   events** is enabled. This one setting is what records pageviews when a visitor moves between pages
   without a full reload — which is how this site navigates. With it off you would only ever see the
   first page of each visit.
4. **Create stream**.

## 3. Get the Measurement ID (the value you need)

The **Measurement ID** is shown at the top-right of the Web stream details panel, in the form
`G-` followed by 10 characters, e.g. `G-XXXXXXXXXX`. Copy it.

To find it again later: **Admin** → **Data collection and modification** → **Data streams** → click
the stream.

Do **not** use any of these — none of them work here:

| Value | Looks like | What it actually is |
|---|---|---|
| **Measurement ID** ✅ | `G-XXXXXXXXXX` | What this site needs |
| Property ID | `123456789` | Internal property number, used by APIs |
| Stream ID | `1234567890` | Internal stream number |
| Measurement Protocol API secret | random string | Server-to-server only; never commit one |
| Tag ID / `GTM-` ID | `GTM-XXXXXXX` | Google Tag Manager, not used by this site |

## 4. Put it in the repository

1. GitHub → repo **Settings** → **Secrets and variables** → **Actions** → the **Variables** tab →
   **New repository variable**.
2. Name: `GA_MEASUREMENT_ID` · Value: your `G-XXXXXXXXXX`.
3. **Actions** tab → *Deploy to GitHub Pages* → **Run workflow** (or just push to `main`).

A variable rather than a secret because the value is public anyway, and masking it would only make
the build logs harder to read. `.github/workflows/deploy.yml` passes it to the build as
`NEXT_PUBLIC_GA_MEASUREMENT_ID`.

The ID is read **at build time**, not at runtime. Adding the variable does nothing until the next
deploy.

**Locally:** leave it out of `.env.local`. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...` only when you
are debugging the tag itself — and if you do that often, create a second GA4 property named
`Wright Stuff Kits dev` rather than polluting production reports with your own clicks.

## 5. Verify it works

1. Open https://wrightstuffkits.com in a normal browser window — no ad blocker, no VPN.
2. GA4 → **Reports** → **Realtime**. Your visit should appear within about 30 seconds.
3. DevTools → Network, or just view-source: `googletagmanager.com/gtag/js?id=G-...` should load.
4. Click through to a product page. The Realtime `page_view` count increments without a full reload.
5. For the ecommerce events, use **Admin** → **DebugView** together with the
   *Google Analytics Debugger* Chrome extension. DebugView shows each event with its parameters, so
   you can confirm `items`, `value`, and `currency` are what you expect.
6. `purchase` can only be verified by a real order on the live site — the PayPal sandbox is used
   locally, where the tag is off. Fold this into the "one real purchase, then refund" step in the
   README's launch runbook and check that the reported revenue matches the captured total.

You can also check a local build without deploying:

```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=test-client-id NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST12345 npm run build
grep -c googletagmanager out/index.html   # expect 1 or more; 0 means the tag is missing
```

## 6. What this site sends

| Event | When | Key parameters | Source |
|---|---|---|---|
| `page_view` | Automatic, incl. in-site navigation | — | Enhanced measurement |
| `add_to_cart` | "Add to cart" or "Buy now" clicked | `currency`, `value`, `items[]` | `src/components/product/PurchasePanel.tsx` |
| `begin_checkout` | `/checkout/` renders a non-empty cart | `currency`, `value`, `items[]` | `src/components/checkout/CheckoutView.tsx` |
| `purchase` | Confirmation page, once per order ID | `transaction_id`, `currency`, `value`, `shipping`, `items[]` | `src/components/checkout/OrderConfirmation.tsx` |

Payloads are built by `src/lib/analytics/events.ts` (unit-tested in `src/test/analytics.test.ts`) and
sent by `src/lib/analytics/track.ts`. Prices cross into GA as dollars; the cart itself stays in
integer cents.

`purchase` is deduplicated against the `wsk-ga-purchase-sent` sessionStorage key, because the
confirmation page re-reads the order on every visit — without that, a refresh would count the same
revenue twice.

`shipping` is derived as *captured total − sum of line items*, since the buyer picks the shipping
option inside PayPal and that is the only split available to the browser.

## 7. Recommended property settings

- **Key events** — `purchase` is counted as a key event automatically. To see funnel drop-off, go to
  **Admin** → **Events** and mark `add_to_cart` and `begin_checkout` as key events too.
- **Data retention** — **Admin** → **Data collection and modification** → **Data retention**. The
  default is 2 months; set event data to **14 months**, the maximum on the free tier. Do this early,
  because it does not apply retroactively.
- **Internal traffic** — so your own browsing does not look like sales traffic:
  **Data streams** → the stream → **Configure tag settings** → **Define internal traffic**, add your
  home/office IP; then **Admin** → **Data filters** and switch the *Internal Traffic* filter from
  Testing to **Active**. Note that an active filter excludes the matching data permanently.
- **Google Ads** — if you run ads, **Admin** → **Product links** → **Google Ads links**, then import
  `purchase` as a conversion in Google Ads. This is the main reason to prefer GA4 over a lighter
  analytics tool here.
- **Google Signals** — optional, off by default. It adds demographics but also data thresholding,
  which hides rows in low-traffic reports. For a store this size, leave it off.

## 8. Privacy

The store is US-only (`site.usOnly`), so no cookie-consent banner is legally required today. GA4 sets
first-party cookies and uses the visitor's IP for coarse geolocation.

If you ever sell outside the US, you need Consent Mode v2 and a banner that gates the tag before it
loads. The tag is deliberately isolated to `src/app/layout.tsx` and `src/lib/analytics/track.ts` to
keep that change small.

If you publish a privacy policy, say that the site uses Google Analytics.

## 9. Troubleshooting

| Symptom | Cause to check |
|---|---|
| No data at all | Variable named exactly `GA_MEASUREMENT_ID`; a deploy has run *since* you added it; `G-` appears in page source |
| Tag loads, Realtime empty | Ad blocker, Brave shields, or a privacy extension. Retry in another browser or on a phone over cellular |
| Pageviews only on the first page of a visit | *Page changes based on browser history events* was turned off in Enhanced measurement |
| `page_view` works, ecommerce events missing | Check DebugView. Also confirm the deploy is current — the events no-op when the ID is absent at build time |
| Revenue counted twice | The `wsk-ga-purchase-sent` dedupe key; check it is being written in sessionStorage |
| Totals look wrong by 100× | Property currency is not USD, or a value was sent in cents |

## Checklist

- [ ] GA4 property created, reporting currency **USD**
- [ ] Web stream for `https://wrightstuffkits.com`, Enhanced measurement on **with** history events
- [ ] `GA_MEASUREMENT_ID` repository **variable** set to the `G-` value
- [ ] Workflow re-run, and `gtag/js?id=G-` present in the deployed page source
- [ ] Realtime shows your own visit
- [ ] `add_to_cart` and `begin_checkout` confirmed in DebugView
- [ ] `purchase` confirmed on the first live order, with the total matching PayPal
- [ ] Data retention raised to 14 months
- [ ] Internal traffic filter active for your IP
- [ ] Google Ads link created, if running ads
