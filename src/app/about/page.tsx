import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">About {site.name}</h1>
      <p>
        {site.name} designs and laser-cuts rubber-powered indoor free-flight kits for Science Olympiad competitors. The instructions cover the parts most kits skip: making the rubber motor, winding, and trimming for long flights.
      </p>
      <p>Each kit includes parts for two airplanes so you have a backup on competition day.</p>
      <p>
        Questions or custom requests? Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </main>
  );
}
