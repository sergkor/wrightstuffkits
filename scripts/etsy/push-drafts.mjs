// Pushes etsy-listings/*.md to Etsy as DRAFT listings (never publishes).
//   npm run etsy:push -- --dry-run            # validate + print payloads, no API writes
//   npm run etsy:push                         # create drafts for files not yet in .etsy-state.json
//   npm run etsy:push -- --only classic-kit   # one slug (comma-separate for several)
//   npm run etsy:push -- --update             # also PATCH listings that already exist
// Listing IDs are recorded in etsy-listings/.etsy-state.json so re-runs never duplicate.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { ROOT, etsy, requireEnv, shopId } from './lib.mjs';

const LISTINGS_DIR = path.join(ROOT, 'etsy-listings');
const STATE_FILE = path.join(LISTINGS_DIR, '.etsy-state.json');
const CUSTOM_PROPERTY_ID = 513; // Etsy's first free-form variation property

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => {
  const i = args.indexOf(f);
  return i === -1 ? undefined : args[i + 1];
};
const dryRun = flag('--dry-run');
const update = flag('--update');
const only = opt('--only')?.split(',');

// ---- parsing ------------------------------------------------------------

function parseListing(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('missing YAML frontmatter');
  const fm = yaml.load(m[1]);
  // Seller notes and paste hints live in HTML comments; Etsy gets only the plain text.
  const description = m[2].replace(/<!--[\s\S]*?-->/g, '').trim();
  return { slug: path.basename(file, '.md'), fm, description };
}

function processingDays(text) {
  const nums = String(text ?? '').match(/\d+/g)?.map(Number) ?? [];
  return nums.length ? { min: nums[0], max: nums[1] ?? nums[0] } : null;
}

const WHO_MADE = { 'i did': 'i_did', 'someone else': 'someone_else', collective: 'collective' };

// ---- validation (mirrors the regexes in Etsy's OpenAPI spec) -------------

function validate({ slug, fm, description }) {
  const errs = [];
  const t = fm.title ?? '';
  if (!t) errs.push('title missing');
  if ([...t].length > 140) errs.push(`title is ${[...t].length} chars (max 140)`);
  if (/[^\p{L}\p{Nd}\p{P}\p{Sm}\p{Zs}™©®]/u.test(t)) errs.push('title has a disallowed character');
  for (const ch of ['%', ':', '&', '+']) {
    if (t.split(ch).length - 1 > 1) errs.push(`title uses "${ch}" more than once`);
  }
  if (!description) errs.push('description body is empty');
  if (!(fm.price > 0)) errs.push('price must be > 0');
  if (!Number.isInteger(fm.quantity) || fm.quantity < 1) errs.push('quantity must be a positive integer');
  if (!WHO_MADE[String(fm.who_made).toLowerCase()]) errs.push(`who_made "${fm.who_made}" not one of: I did / someone else / collective`);
  if (!fm.when_made) errs.push('when_made missing (e.g. 2020_2026 or made_to_order)');

  const tags = fm.tags ?? [];
  if (tags.length > 13) errs.push(`${tags.length} tags (max 13)`);
  for (const tag of tags) {
    if ([...tag].length > 20) errs.push(`tag "${tag}" over 20 chars`);
    if (/[^\p{L}\p{Nd}\p{Zs}\-'™©®]/u.test(tag)) errs.push(`tag "${tag}" has a disallowed character`);
  }
  const materials = fm.materials ?? [];
  if (materials.length > 13) errs.push(`${materials.length} materials (max 13)`);
  for (const mat of materials) {
    if (/[^\p{L}\p{Nd}\p{Zs}]/u.test(mat)) errs.push(`material "${mat}" may only contain letters, numbers, spaces`);
  }
  // Calculated-shipping profiles reject listings without weight + dimensions.
  const pkg = fm.package ?? {};
  for (const k of ['weight_oz', 'length_in', 'width_in', 'height_in']) {
    if (!(pkg[k] > 0)) errs.push(`package.${k} must be > 0 (needed for calculated shipping)`);
  }
  for (const v of fm.variations ?? []) {
    if (!v.sku || !v.label || !(v.price > 0)) errs.push(`variation ${JSON.stringify(v)} needs sku, label, price`);
    if (/[()]/.test(v.label)) errs.push(`variation label "${v.label}" may not contain parentheses`);
  }
  if (errs.length) throw new Error(`${slug}:\n  - ${errs.join('\n  - ')}`);
}

// ---- payload builders ---------------------------------------------------

// Etsy requires a processing profile ("readiness state") on physical listings.
// Reuse one that matches the file's processing_time / when_made, else create it.
let readinessCache;
async function readinessStateFor(shop, fm) {
  if (process.env.ETSY_READINESS_STATE_ID) return Number(process.env.ETSY_READINESS_STATE_ID);
  const want = {
    readiness_state: fm.when_made === 'made_to_order' ? 'made_to_order' : 'ready_to_ship',
    ...(processingDays(fm.processing_time) ?? { min: 1, max: 3 }),
  };
  readinessCache ??= (await etsy('GET', `/shops/${shop}/readiness-state-definitions`)).results ?? [];
  // Response fields differ from the request fields in Etsy's spec:
  // readiness_state_id (not readiness_state_definition_id), min/max_processing_days (not _time).
  const idOf = (d) => d.readiness_state_id ?? d.readiness_state_definition_id;
  const hit = readinessCache.find(
    (d) =>
      d.readiness_state === want.readiness_state &&
      (d.min_processing_days ?? d.min_processing_time) === want.min &&
      (d.max_processing_days ?? d.max_processing_time) === want.max,
  );
  if (hit) return idOf(hit);
  const created = await etsy(
    'POST',
    `/shops/${shop}/readiness-state-definitions`,
    new URLSearchParams({
      readiness_state: want.readiness_state,
      min_processing_time: String(want.min),
      max_processing_time: String(want.max),
      processing_time_unit: 'days',
    }),
  );
  readinessCache.push(created);
  const id = idOf(created);
  if (!id) throw new Error(`Could not read the processing profile ID from Etsy's response: ${JSON.stringify(created)}`);
  console.log(`       created processing profile ${id} (${want.readiness_state} ${want.min}-${want.max} days)`);
  return id;
}

function listingForm({ fm, description }, { creating, readinessStateId }) {
  const variations = fm.variations ?? [];
  const price = variations.length ? Math.min(...variations.map((v) => v.price)) : fm.price;
  const quantity = variations.length ? variations.length * fm.quantity : fm.quantity;
  const form = new URLSearchParams({
    title: fm.title,
    description,
    price: String(price),
    quantity: String(quantity),
    who_made: WHO_MADE[String(fm.who_made).toLowerCase()],
    when_made: String(fm.when_made),
    taxonomy_id: requireEnv('ETSY_TAXONOMY_ID'),
    shipping_profile_id: requireEnv('ETSY_SHIPPING_PROFILE_ID'),
    return_policy_id: requireEnv('ETSY_RETURN_POLICY_ID'),
    tags: (fm.tags ?? []).join(','),
    materials: (fm.materials ?? []).join(','),
    is_supply: 'false',
  });
  if (creating) form.set('type', 'physical');
  if (readinessStateId) form.set('readiness_state_id', String(readinessStateId));
  const pkg = fm.package;
  form.set('item_weight', String(pkg.weight_oz));
  form.set('item_weight_unit', 'oz');
  form.set('item_length', String(pkg.length_in));
  form.set('item_width', String(pkg.width_in));
  form.set('item_height', String(pkg.height_in));
  form.set('item_dimensions_unit', 'in');
  return form;
}

function inventoryBody({ fm }, readiness) {
  const products = (fm.variations ?? []).map((v, i) => ({
    sku: v.sku,
    property_values: [
      {
        property_id: CUSTOM_PROPERTY_ID,
        property_name: fm.option_label ?? 'Option',
        value_ids: [i + 1], // arbitrary but unique; Etsy accepts any ints for custom properties
        values: [v.label],
      },
    ],
    offerings: [{ price: v.price, quantity: fm.quantity, is_enabled: true, readiness_state_id: readiness }],
  }));
  return {
    products,
    price_on_property: [CUSTOM_PROPERTY_ID],
    quantity_on_property: [],
    sku_on_property: [CUSTOM_PROPERTY_ID],
    readiness_state_on_property: [],
  };
}

// Photo entries that are "[TODO: ...]" placeholders or missing on disk are skipped.
function existingPhotos(fm) {
  return (fm.photos ?? []).filter((p) => typeof p === 'string' && !p.startsWith('[') && existsSync(path.join(ROOT, p)));
}

async function uploadImage(shop, listingId, rel, rank, alt) {
  const file = path.join(ROOT, rel);
  const fd = new FormData();
  fd.set('image', new Blob([readFileSync(file)]), path.basename(file));
  fd.set('rank', String(rank));
  fd.set('alt_text', alt.slice(0, 500));
  return etsy('POST', `/shops/${shop}/listings/${listingId}/images`, fd);
}

// ---- main ---------------------------------------------------------------

const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');

const files = readdirSync(LISTINGS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => path.join(LISTINGS_DIR, f))
  .filter((f) => !only || only.includes(path.basename(f, '.md')));

if (!files.length) {
  console.error('No listing files matched.');
  process.exit(1);
}

const listings = files.map(parseListing);
let failed = 0;
for (const l of listings) {
  try {
    validate(l);
  } catch (e) {
    failed++;
    console.error(`INVALID ${e.message}`);
  }
}
if (failed) process.exit(1);

const shop = dryRun ? '<shop_id>' : await shopId();

for (const l of listings) {
  const existing = state[l.slug];
  const creating = !existing;
  if (!creating && !update) {
    console.log(`skip   ${l.slug} (listing ${existing.listing_id} exists; pass --update to patch)`);
    continue;
  }
  const photos = existingPhotos(l.fm);

  if (dryRun) {
    const form = listingForm(l, { creating, readinessStateId: '<auto>' });
    const proc = processingDays(l.fm.processing_time);
    console.log(`\n=== ${l.slug} (${creating ? 'create' : `update ${existing.listing_id}`}) ===`);
    console.log(Object.fromEntries([...form].map(([k, v]) => [k, k === 'description' ? `${v.slice(0, 80)}… (${v.length} chars)` : v])));
    console.log(`processing profile: ${l.fm.when_made === 'made_to_order' ? 'made_to_order' : 'ready_to_ship'} ${proc?.min ?? 1}-${proc?.max ?? 3} days (reused or created)`);
    console.log('photos:', photos);
    if (l.fm.variations?.length) console.log('inventory:', JSON.stringify(inventoryBody(l, '<auto>'), null, 2));
    continue;
  }

  try {
    const readinessStateId = await readinessStateFor(shop, l.fm);
    const form = listingForm(l, { creating, readinessStateId });
    const inv = l.fm.variations?.length ? inventoryBody(l, readinessStateId) : null;
    let listingId = existing?.listing_id;
    if (creating) {
      const res = await etsy('POST', `/shops/${shop}/listings`, form);
      listingId = res.listing_id;
      state[l.slug] = { listing_id: listingId, images: [], updated_at: new Date().toISOString() };
      saveState();
      console.log(`create ${l.slug} → listing ${listingId} (${res.state})`);
    } else {
      await etsy('PATCH', `/shops/${shop}/listings/${listingId}`, form);
      console.log(`update ${l.slug} → listing ${listingId}`);
    }

    if (inv) {
      await etsy('PUT', `/listings/${listingId}/inventory`, inv);
      console.log(`       variations set (${inv.products.length} options)`);
    }

    const done = new Set(state[l.slug].images);
    let rank = done.size;
    for (const rel of photos) {
      if (done.has(rel)) continue;
      rank++;
      await uploadImage(shop, listingId, rel, rank, l.fm.title);
      state[l.slug].images.push(rel);
      saveState();
      console.log(`       image ${rank}: ${rel}`);
    }
    state[l.slug].updated_at = new Date().toISOString();
    saveState();
    console.log(`       https://www.etsy.com/your/shops/me/tools/listings/${listingId}`);
  } catch (e) {
    failed++;
    console.error(`FAILED ${l.slug}: ${e.message}`);
  }
}

if (failed) process.exit(1);
console.log(dryRun ? '\nDry run complete — nothing was sent to Etsy.' : '\nDone. Review the drafts in Shop Manager before publishing.');
