'use client';
import { Button } from '@/components/ui/button';
import { CATEGORIES, type Category } from '@/lib/catalog';

export function CategoryFilter({ value, onChange }: { value: Category | ''; onChange: (c: Category | '') => void }) {
  const all: { value: Category | ''; label: string }[] = [{ value: '', label: 'All' }, ...CATEGORIES];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {all.map((c) => (
        <Button
          key={c.value || 'all'}
          size="sm"
          variant={value === c.value ? 'default' : 'outline'}
          onClick={() => onChange(c.value)}
          aria-pressed={value === c.value}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );
}
