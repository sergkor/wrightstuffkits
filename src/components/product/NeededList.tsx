import { X } from 'lucide-react';

export function NeededList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">You will need</h2>
      <ul className="space-y-1 text-sm">
        {items.map((s) => (
          <li key={s} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{s}</li>
        ))}
      </ul>
    </section>
  );
}
