export const PURCHASE_SENT_KEY = 'wsk-ga-purchase-sent';

/**
 * True the first time an order id is seen. The confirmation page re-reads the order from
 * sessionStorage on every visit, so without this a refresh or back-navigation double-counts revenue.
 * A blocked or throwing storage degrades to one send per page load — better than never sending.
 */
export function claimPurchase(orderId: string, storage: Storage): boolean {
  try {
    if (storage.getItem(PURCHASE_SENT_KEY) === orderId) return false;
    storage.setItem(PURCHASE_SENT_KEY, orderId);
    return true;
  } catch {
    return true;
  }
}
