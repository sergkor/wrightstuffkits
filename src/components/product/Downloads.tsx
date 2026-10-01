import { FileDown } from 'lucide-react';

export function Downloads({ downloads }: { downloads: { label: string; href: string }[] }) {
  if (downloads.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Manuals and guides</h2>
      <ul className="space-y-2 text-sm">
        {downloads.map((d) => (
          <li key={d.href}>
            <a href={d.href} download className="inline-flex items-center gap-2 underline-offset-2 hover:underline">
              <FileDown className="size-4" />{d.label} (PDF)
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
