'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Variant } from '@/lib/catalog';
import { formatCents } from '@/lib/format';

export function VariantSelector({
  label,
  variants,
  value,
  onChange,
}: {
  label: string;
  variants: Variant[];
  value: string;
  onChange: (sku: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="variant">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="variant" className="w-full" data-testid="variant-select"><SelectValue /></SelectTrigger>
        <SelectContent>
          {variants.map((v) => (
            <SelectItem key={v.sku} value={v.sku} disabled={!v.inStock}>
              {v.label} — {formatCents(v.priceCents)}{v.inStock ? '' : ' (sold out)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
