import type { Metadata } from 'next';
import { faq } from '@/content/faq';

export const metadata: Metadata = { title: 'FAQ, shipping & returns' };

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">FAQ, shipping &amp; returns</h1>
      <dl className="space-y-6">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold">{f.q}</dt>
            <dd className="mt-1 text-muted-foreground">{f.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
