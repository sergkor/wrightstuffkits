# Website Changes — October 2026

Date: 2026-10-05
Status: Requested by owner; implementation plan at `docs/superpowers/plans/2026-10-05-website-changes.md`
Source: Google Doc "WebsiteChanges" (`1EiHjVYuNF9tcx3whwEDMqMUKixAV1cspUfSTi6Cg5y0`), transcribed verbatim below. Images from the doc and the linked Drive file are staged (untracked) in `inventory/renders/`.

## Owner's change list (verbatim)

- Remove Logo

Home Page:
- Get rid of "Which kit?" section
- "Rubber-powered flyer kits built to win." -> "Rubber-Powered Plane Kits"
- "Science Olympiad free-flight kits and propeller supplies. Laser-cut parts, Mylar or tissue covering, and instructions that cover building, winding, and trimming."
  ->
  "Science Olympiad free-flight kits and propeller supplies. Laser-cut parts, Carbon fiber rods, covering, and other building supplies with step-by-step instructions that cover building and flight testing."

About Section:
- Rewritten Description:

  "Wright Stuff Kits designs and sells laser-cut rubber-powered indoor free-flight kits for Science Olympiad competitors. Each kit includes enough parts to build two airplanes, along with step-by-step building instructions and guidance for flight testing and trimming.

  Every model was designed by an alumni Science Olympiad competitor who placed 1st at the MIT Science Olympiad Invitational in the 2025 and 2026 seasons.

  Kits are designed to the Division C 2027 Flight rules. Read the current rules and event details at soinc.org.

  Questions or custom requests? Email orders@wrightstuffkits.com."

Kits description:
- Change names "Advanced" -> "Elliptical", "Intermediate" -> "Classic"
- Get rid of "Specifications" section
- Get rid of "In the box" section
- For advanced/Elliptical kit get rid of "designed for 3+ minutes"
- For beginner kit change "Ikara 24 cm propeller." to just "ready to use 24cm pvc propeller"
- In descriptions for elliptical and Classic designs include that materials are provided to build 2 balsa propellers + one ready to use 24cm pvc propeller is provided

Add a Classic + Elliptical kit Package for 84.99$
- Description:

  "This Package comes with materials to build an Elliptical and Classic kit plane. Both comply with Division C 2027 Science Olympiad rules.

  Comes materials to build 2 propellers + a ready to use 24cm pvc propeller. Also includes step-by-step instructions covering assembly, motor making, winding tips, and trimming."

- Image: (embedded; split render of Elliptical over Classic) — Drive file `Package_Kit` (`1dY3ai0noWrwCS0Why_2R9i-WfzEjQvKX`)

Re-rendered images for planes (embedded, in doc order):
1. Beginner — blue rectangular wings, 1999×852, transparent background
2. Elliptical — grey elliptical wing with endplate stabilizer, 1999×1053, transparent
3. Classic — grey rectangular wings, 1999×1053, transparent

## Staged source assets (untracked, `inventory/` is gitignored)

| File | Content | Size |
|---|---|---|
| `inventory/renders/beginner.png` | Beginner re-render | 1999×852 RGBA |
| `inventory/renders/elliptical.png` | Elliptical (was Advanced) re-render | 1999×1053 RGBA |
| `inventory/renders/classic.png` | Classic (was Intermediate) re-render | 1999×1053 RGBA |
| `inventory/renders/package.png` | Package product image (Drive `Package_Kit`) | 1048×826 RGBA |

## Interpretation decisions (not stated in the doc)

- "Remove Logo" = remove the logo image from the header and the home hero. The favicon/apple icon stay.
- Renaming kits renames their slugs, SKUs, content files and image folders too (`elliptical-kit`/`ELL-KIT`, `classic-kit`/`CLS-KIT`). The site has not launched, so no live URLs or orders break.
- Removing "In the box" removes the `included` and `specs` data entirely. The "You will need" (tools not included) list stays.
- "Carbon fiber rods" in the hero copy is lower-cased mid-sentence.
- Package product: slug `classic-elliptical-package`, SKU `PKG-CLS-ELL`, $84.99, category `kits`, featured on the home page.
- New renders are flattened onto white at prepare time (they are transparent PNGs) and product cards switch from `object-cover` to `object-contain` so wingtips are never cropped.
