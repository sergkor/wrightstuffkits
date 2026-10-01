import Link from 'next/link';
import { site } from '@/content/site';

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <nav className="flex gap-4">
          <Link href="/faq/">Shipping &amp; returns</Link>
          <Link href="/contact/">Contact</Link>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </nav>
      </div>
    </footer>
  );
}
