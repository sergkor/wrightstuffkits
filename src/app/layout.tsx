import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { CartHydration } from '@/components/cart/CartHydration';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
  openGraph: { siteName: site.name, type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <CartHydration />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
