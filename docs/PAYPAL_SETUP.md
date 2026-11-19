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

## 6. Address and shipping rules

The site rejects non-US addresses inside the PayPal popup. No PayPal setting is required.

Shipping speed is a choice only on the PayPal and Venmo buttons. PayPal does not support shipping options or the
shipping callback on the unbranded **Debit or Credit Card** flow — it never fires the callback for a guest buyer, so an
order that still carries shipping options is refused at approval with "Your order can't be shipped to this address."
The site therefore sends no shipping options on that flow and charges the default option (USPS Ground Advantage) flat.
If you change which option is the default in `src/content/site.ts`, that is what every card buyer pays.

## 6b. Venmo

The SDK asks for Venmo via `enable-funding=venmo`, so the button appears whenever PayPal considers
the buyer eligible: US merchant, US buyer, USD, and the Venmo app installed. Desktop buyers scan a
QR code with the app. If Venmo is off for your account, enable it under Account Settings → Payment
preferences; an ineligible buyer simply never sees the button, which needs no handling here.

## 6c. Hosted buttons (the "Pay on PayPal instead" fallback)

These bypass the JS SDK completely, so a buyer whose card checkout fails still has a way to pay, and
PayPal collects the shipping address on its own page. One button per variant, created by you:

1. paypal.com → **Pay & Get Paid → PayPal Buttons** (Payment Links & Buttons) → **Button Builder**.
2. Build a **Buy Now** button for one variant. Set the item name and price to match
   `src/content/products/<product>.ts` exactly, and turn **on** shipping address collection.
3. Copy the id out of the generated snippet's URL — `https://www.paypal.com/ncp/payment/<ID>`.
4. Put it on that variant as `hostedButtonId: '<ID>'`. The button only renders where an id exists,
   so you can add them one at a time.

**PayPal holds the price, not this repo.** Nothing checks that they agree, and the fallback button
deliberately shows no amount. Whenever you change a `priceCents`, re-create that button and update
its id, or buyers will be charged the old price.

Do **not** use the older "Website Payments Standard" buttons (`cgi-bin/webscr`, `cmd=_s-xclick`).
PayPal is retiring them before January 2027.

## 6d. Invoices and purchase orders

Schools and clubs frequently cannot pay by card and need an invoice to raise a PO. The checkout page
offers "Need an invoice or purchase order?", which opens a prefilled email to `contactEmail` with the
cart, an items total, and blanks for organization, PO number, and shipping address. Shipping is left
for you to add, since the site never computes it. There is no automation behind this: the request
arrives as an ordinary email and you invoice by hand.

A PayPal invoice also solves "we want to pay by card": its Pay button accepts a debit or credit card
from someone with no PayPal account, and it is a different product from the site's checkout, so none
of the JS SDK's card-flow problems apply to it.

### Building the invoice

1. paypal.com → **Pay & Get Paid → Invoicing → Create invoice**.
2. **Bill to**: the billing contact and email from their request. Leave your own business name and
   logo as configured under Invoicing → Settings so receipts look consistent.
3. **Items**: one line per line in their email. Copy the item name, and set the unit price from
   `src/content/products/<product>.ts` — not from the email, which is only as current as the day
   they loaded the page. Put the SKU in the line's description so §7 below can be carried out.
4. **Shipping**: add it as its own line, named for the service (for example "USPS Ground Advantage").
   Use the rates in `src/content/site.ts`, or the real postage if this order is heavy or awkward —
   nothing reconciles the two, so the invoice is the final word.
5. **Sales tax**: only if you have tax configured for that state (§5). The site never computes tax,
   so do not re-add it by hand if PayPal is already applying it.
6. **Reference / PO number**: their purchase order number, if they gave one. Schools usually need it
   on the invoice itself before they can pay.
7. **Shipping address**: put the address from their email on the invoice. Do this even though it
   feels redundant — Seller Protection covers you only for the address on the transaction (§8).
8. **Note to the buyer**: payment terms, and for a custom propeller order, ask for the design file
   (DXF preferred, or an image with a size) in reply to the invoice.
9. **Due date**: net 30 suits school purchasing cycles; shorter if you are holding stock for them.
10. Send it. PayPal emails them a payable link and emails you when it is paid, which is your order
    record (§5). Unpaid invoices sit under Invoicing with a reminder button.

Ship only once payment clears, then follow §7 to check the invoice against the catalogue before the
parcel goes out. Invoices are free to send; the card fee comes off the payment — check your own
rate under [PayPal's fee schedule](https://www.paypal.com/us/business/paypal-business-fees), since
guest card payments and direct card payments are priced differently.

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

- [x] `contactEmail` set in `src/content/site.ts` (orders@wrightstuffkits.com, live)
- [ ] Shipping rates in `src/content/site.ts` match what USPS actually costs you
- [ ] Live Client ID in GitHub secret and deployed
- [ ] Custom domain and HTTPS enabled in GitHub Pages
- [ ] One real purchase of the cheapest item from a second PayPal account, then refunded
