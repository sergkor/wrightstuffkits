# Etsy draft listings via the Open API

`scripts/etsy/` pushes the files in `etsy-listings/` to your Etsy shop as **draft** listings. Nothing is ever published by the script — you review and publish in Shop Manager.

## One-time setup

1. **Register an app** at <https://www.etsy.com/developers/your-apps>.
   - Personal apps go through Etsy's approval queue (usually a few days). Say it is for managing your own shop's listings.
   - Under *Callback URLs* add exactly `http://localhost:3003/callback`.
   - Copy the **Keystring** and **Shared secret**.
2. Create `.env.local` from `.env.example` and set `ETSY_API_KEY=<keystring>` and `ETSY_SHARED_SECRET=<shared secret>`.
3. In Shop Manager, make sure you have at least one **shipping profile** (Settings › Shipping) and one **return policy** (Settings › Policies). The API requires both on a physical listing.
4. Log in once:
   ```sh
   npm run etsy:auth
   ```
   A browser tab opens for consent; tokens are stored in `.etsy/tokens.json` (gitignored) and refresh automatically.
5. Find the IDs the uploader needs and put them in `.env.local`:
   ```sh
   npm run etsy:lookup                       # shipping profiles, return policies, taxonomy search for "model airplane"
   npm run etsy:lookup -- "model kit"        # different taxonomy search
   ```
   Set `ETSY_TAXONOMY_ID`, `ETSY_SHIPPING_PROFILE_ID`, `ETSY_RETURN_POLICY_ID`. Etsy's seller taxonomy has no "Model Kits" node; use `1569` (Toys & Games > Sports & Outdoor Recreation > Flying Toys).
   Processing profiles ("readiness states") are required on physical listings; the push script reuses or creates one per listing from `when_made` + `processing_time` (e.g. `ready_to_ship 1-2 days`, `made_to_order 3-5 days`). Set `ETSY_READINESS_STATE_ID` only to force a single existing profile.

## Pushing listings

```sh
npm run etsy:push -- --dry-run          # validates every file and prints the exact payloads; no API calls
npm run etsy:push                       # creates drafts for files not yet in etsy-listings/.etsy-state.json
npm run etsy:push -- --only classic-kit # one file (comma-separate several)
npm run etsy:push -- --update           # re-send title/description/tags/etc. for listings that already exist
```

Per listing the script: creates the draft → sets variations (if `variations:` is present) → uploads each existing path in `photos:` in order. `etsy-listings/.etsy-state.json` records the listing ID and uploaded images so re-runs update instead of duplicating; commit it.

## How the Markdown maps to Etsy

| Frontmatter | Etsy field | Notes |
|---|---|---|
| `title` | title | ≤140 chars; `% : & +` at most once each |
| body (minus `<!-- -->`) | description | plain text |
| `price` | price | for variations, the minimum option price is sent |
| `quantity` | quantity | per option when variations exist |
| `who_made` / `when_made` | who_made / when_made | `I did` → `i_did`; `2020_2026` or `made_to_order` |
| `tags` | tags | ≤13, each ≤20 chars; letters/numbers/spaces/`-`/`'` only |
| `materials` | materials | ≤13; **letters, numbers, spaces only** (no `"`, `/`, `(`) |
| `processing_time` + `when_made` | readiness_state_id | processing profile matched or created from the first two integers (days) and ready_to_ship / made_to_order |
| `package.{weight_oz,length_in,width_in,height_in}` | item_weight / item_length / … | required when the shipping profile uses calculated shipping |
| `photos` | listing images | `[TODO: …]` entries and missing files are skipped |
| `option_label` + `variations[]` | inventory (custom property 513) | `sku`, `label`, `price` per option |

Validation runs before any API call and fails the whole run on the first invalid file.

## Not handled by the script (set in Shop Manager after the draft exists)

- Personalization toggle and instructions (Custom Laser-cut Propeller needs it).
- Shop section, renewal setting.
- Photos larger than the 1600 px web copies — Etsy prefers 2000 px on the long edge; replace from the originals in `inventory/` if you want sharper images.

## Troubleshooting

- `401` on every call: the keystring is wrong or the app is not yet approved.
- `403 Shared secret is required in x-api-key header`: `ETSY_SHARED_SECRET` is missing from `.env.local`.
- `403 Access token lacks scope`: run `npm run etsy:auth` again — the consent page re-grants all current scopes (`listings_r listings_w shops_r shops_w`).
- `400` mentioning `shipping_profile_id` / `return_policy_id`: the ID is not from this shop — re-run `npm run etsy:lookup`.
- `400 A readiness_state_id is required`: unset `ETSY_READINESS_STATE_ID` so the script creates profiles itself.
