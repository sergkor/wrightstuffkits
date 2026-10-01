export function requireEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) throw new Error(`Missing required env var ${name}`);
  return value.trim();
}
