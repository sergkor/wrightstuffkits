import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wright Stuff Kits',
  description: 'Science Olympiad free-flight kits and propeller supplies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
