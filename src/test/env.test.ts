import { describe, expect, it } from 'vitest';
import { requireEnv } from '@/lib/env';

describe('requireEnv', () => {
  it('returns the trimmed value when present', () => {
    expect(requireEnv('X', ' abc ')).toBe('abc');
  });
  it('throws when missing or blank', () => {
    expect(() => requireEnv('X', undefined)).toThrow('Missing required env var X');
    expect(() => requireEnv('X', '  ')).toThrow('Missing required env var X');
  });
});
