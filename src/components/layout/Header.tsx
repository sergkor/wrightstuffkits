import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/content/site';
import { CartTrigger } from './CartTrigger';
import { MobileNav } from './MobileNav';

export const NAV_LINKS = [
  { href: '/products/', label: 'Shop' },
  { href: '/products/?cat=kits', label: 'Kits' },
  { href: '/products/?cat=propellers', label: 'Propellers' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <MobileNav links={NAV_LINKS} />
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/images/brand/logo.svg" alt="" width={28} height={28} />
          <span>{site.name}</span>
        </Link>
        <nav className="ml-6 hidden gap-5 text-sm md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <CartTrigger />
        </div>
      </div>
    </header>
  );
}
