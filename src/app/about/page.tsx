import type { Metadata } from 'next';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold">About {site.name}</h1>
      <p>
        {site.name} designs and sells laser-cut rubber-powered indoor free-flight kits for Science Olympiad competitors. Each kit includes enough parts to build two airplanes, along with step-by-step building instructions and guidance for flight testing and trimming.
      </p>
      <p>
        Every model was designed by an alumni Science Olympiad competitor who placed 1st at the MIT Science Olympiad Invitational in the 2025 and 2026 seasons.
      </p>
      <p>
        Kits are designed to the Division C 2027 Flight rules. Read the current rules and event details at{' '}
        <a className="underline" href="https://www.soinc.org/" target="_blank" rel="noopener noreferrer">
          soinc.org
        </a>
        .
      </p>
      <p>
        Questions or custom requests? Email <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </main>
  );
}
