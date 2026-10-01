import { describe, expect, it } from 'vitest';
import { fillTemplate, formatCents } from '@/lib/format';

describe('formatCents', () => {
  it('formats whole and fractional dollars', () => {
    expect(formatCents(7599)).toBe('$75.99');
    expect(formatCents(699)).toBe('$6.99');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(100000)).toBe('$1,000.00');
  });
});

describe('fillTemplate', () => {
  it('replaces {key} placeholders', () => {
    expect(fillTemplate('mail {contactEmail} now', { contactEmail: 'a@b.c' })).toBe('mail a@b.c now');
  });
  it('leaves unknown keys alone', () => {
    expect(fillTemplate('{x}', {})).toBe('{x}');
  });
});
