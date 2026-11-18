export function requireEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) throw new Error(`Missing required env var ${name}`);
  return value.trim();
}

/** For env vars the build may legitimately omit (local dev, PRs), unlike requireEnv's hard fail. */
export function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
