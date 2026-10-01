export function SpecTable({ specs }: { specs: Record<string, string> }) {
  const rows = Object.entries(specs);
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
      <dl className="divide-y rounded-lg border text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[1fr_2fr] gap-3 p-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
