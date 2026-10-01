import { Check, X } from 'lucide-react';

export function IncludedList({ included, notIncluded }: { included: string[]; notIncluded: string[] }) {
  if (included.length === 0 && notIncluded.length === 0) return null;
  return (
    <section className="grid gap-6 md:grid-cols-2">
      {included.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">In the box</h2>
          <ul className="space-y-1 text-sm">
            {included.map((s) => (
              <li key={s} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-green-600" />{s}</li>
            ))}
          </ul>
        </div>
      )}
      {notIncluded.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">You will need</h2>
          <ul className="space-y-1 text-sm">
            {notIncluded.map((s) => (
              <li key={s} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
