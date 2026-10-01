export function Description({ text }: { text: string }) {
  return (
    <section className="space-y-3 text-base leading-relaxed">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>{para.trim()}</p>
      ))}
    </section>
  );
}
