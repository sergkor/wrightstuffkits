# Etsy listings

One file per product, matching the catalog in `src/content/products/`:

| File | Product | Price |
|---|---|---|
| `beginner-kit.md` | Beginner Kit | $49.99 |
| `classic-kit.md` | Classic Kit | $75.99 |
| `elliptical-kit.md` | Elliptical Kit | $75.99 |
| `classic-elliptical-package.md` | Classic + Elliptical Kit Package | $84.99 |
| `propeller-kit.md` | Propeller Kit | $6.99 |
| `custom-propeller.md` | Custom Laser-cut Propeller | $12.99–$28.99 (variations) |

Each file has: title (≤140 chars), price/variations, listing settings, photo order, the plain-text description to paste, 13 tags (≤20 chars), materials, attributes, and seller notes.

## Before publishing

- Etsy descriptions are plain text: paste the block between the `---` lines as-is; bullets and caps survive, markdown does not.
- Shipping and return lines mirror the site FAQ (2-day processing, 30-day unopened returns, 7-day damage window, US only). If you change the FAQ, change these too.
- Lines marked as assumptions in the "Notes for the seller" sections (prop shaft diameter, max custom blade length) need your real numbers.
- Reuse the same photos as the site so the two storefronts match. Etsy wants 2000 px on the long edge, so export Etsy copies from the full-size originals in `inventory/` rather than the 1600 px web images.
- Keep "Science Olympiad" as a description of what the kit is designed for; do not use the logo or imply endorsement.
