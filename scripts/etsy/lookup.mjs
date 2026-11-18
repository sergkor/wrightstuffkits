// Prints the IDs push-drafts.mjs needs in .env.local: taxonomy, shipping profile,
// return policy, and (optional) processing profile.
//   npm run etsy:lookup                       # shop profiles + default taxonomy search
//   npm run etsy:lookup -- "model airplane"   # search the seller taxonomy for a phrase
import { etsy, shopId } from './lib.mjs';

const query = (process.argv[2] ?? 'model airplane').toLowerCase();
const shop = await shopId();
console.log(`shop_id=${shop}\n`);

const profiles = await etsy('GET', `/shops/${shop}/shipping-profiles`);
console.log('SHIPPING PROFILES  (ETSY_SHIPPING_PROFILE_ID)');
for (const p of profiles.results ?? []) {
  console.log(`  ${p.shipping_profile_id}  ${p.title}  (${p.origin_country_iso}, ${p.min_processing_days}-${p.max_processing_days} days)`);
}
if (!profiles.results?.length) console.log('  none — create one in Shop Manager > Settings > Shipping settings');

const policies = await etsy('GET', `/shops/${shop}/policies/return`);
console.log('\nRETURN POLICIES  (ETSY_RETURN_POLICY_ID)');
for (const r of policies.results ?? []) {
  console.log(`  ${r.return_policy_id}  accepts_returns=${r.accepts_returns} accepts_exchanges=${r.accepts_exchanges} deadline=${r.return_deadline ?? '-'} days`);
}
if (!policies.results?.length) console.log('  none — create one in Shop Manager > Settings > Policy settings');

try {
  const states = await etsy('GET', `/shops/${shop}/readiness-state-definitions`);
  console.log('\nPROCESSING PROFILES  (ETSY_READINESS_STATE_ID, optional)');
  for (const s of states.results ?? []) {
    console.log(`  ${s.readiness_state_id ?? s.readiness_state_definition_id}  ${s.readiness_state}  ${s.processing_days_display_label ?? `${s.min_processing_days}-${s.max_processing_days} days`}`);
  }
} catch (e) {
  console.log(`\nPROCESSING PROFILES: unavailable (${e.status ?? e.message})`);
}

// Seller taxonomy is a tree; flatten it and print every node whose path mentions the query.
const tax = await etsy('GET', '/seller-taxonomy/nodes');
const hits = [];
const walk = (node, trail) => {
  const path = [...trail, node.name];
  if (path.join(' > ').toLowerCase().includes(query)) hits.push({ id: node.id, path: path.join(' > ') });
  for (const c of node.children ?? []) walk(c, path);
};
for (const n of tax.results ?? []) walk(n, []);
console.log(`\nTAXONOMY matching "${query}"  (ETSY_TAXONOMY_ID)`);
for (const h of hits) console.log(`  ${h.id}  ${h.path}`);
if (!hits.length) console.log('  no matches — try another phrase, e.g. npm run etsy:lookup -- "model kit"');
