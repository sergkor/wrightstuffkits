import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p>
        Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. We reply within one business day.
      </p>
      <p>For custom propellers, attach your design (DXF preferred, or an image with a size) and include your PayPal order ID in the subject line.</p>
    </main>
  );
}
