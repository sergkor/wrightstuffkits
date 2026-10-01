'use client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBox({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
        aria-label="Search products"
        data-testid="search"
      />
    </div>
  );
}
