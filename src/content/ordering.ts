// Set to null to resume ordering; set the object to pause it. One switch, because a pause has to
// reach three places at once: the site-wide notice, the payment buttons, and the stale carts
// already sitting in buyers' browsers.
//
// Marking stock is separate and still per variant (`inStock` in src/content/products/*.ts), so a
// partial restock does not need this flag touched at all — clear it only when ordering reopens.
//
// Deliberately free of env imports so tests and e2e can read it without a PayPal client id.
export interface OrderingPause {
  heading: string;
  body: string;
}

export const orderingPause: OrderingPause | null = {
  heading: 'Out of stock — orders paused',
  body: 'Every kit is currently out of stock and we have paused order processing while we restock. Nothing can be bought right now. Email us and we will tell you as soon as kits are back, or send an invoice request if your school needs a quote for a future order.',
};

export function isOrderingPaused(): boolean {
  return orderingPause !== null;
}
