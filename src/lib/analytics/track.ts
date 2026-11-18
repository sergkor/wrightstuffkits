'use client';
import { sendGAEvent } from '@next/third-parties/google';
import { site } from '@/content/site';
import type { GaCartEvent, GaPurchaseEvent } from './events';

type GaEventName = 'add_to_cart' | 'begin_checkout' | 'purchase';

/**
 * Fire-and-forget GA4 event. No-ops when no measurement ID is configured (local dev, PR builds),
 * and never lets an analytics failure break a cart or checkout interaction.
 */
export function track(name: GaEventName, params: GaCartEvent | GaPurchaseEvent): void {
  if (!site.gaMeasurementId) return;
  try {
    sendGAEvent('event', name, params);
  } catch {
    // ignore: the tag may be blocked by an extension or still loading
  }
}
