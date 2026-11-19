import { orderingPause } from '@/content/ordering';
import { site } from '@/content/site';

// Explains the sold-out labels wherever a buyer meets them, so the catalogue does not just look
// broken. Renders nothing once ordering resumes.
export function OrderingNotice() {
  if (!orderingPause) return null;
  return (
    <aside role="status" data-testid="ordering-notice" className="border-b bg-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-3 text-sm">
        <p className="font-semibold">{orderingPause.heading}</p>
        <p className="text-muted-foreground">
          {orderingPause.body}{' '}
          <a className="underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
        </p>
      </div>
    </aside>
  );
}
