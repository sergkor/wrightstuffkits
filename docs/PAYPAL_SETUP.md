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
