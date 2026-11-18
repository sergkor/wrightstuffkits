// Shared helpers for the Etsy Open API v3 scripts (auth, lookup, push-drafts).
// Run with Node 22: `node --env-file-if-exists=.env.local scripts/etsy/<script>.mjs`.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const TOKEN_FILE = path.join(ROOT, '.etsy', 'tokens.json');
export const API = 'https://openapi.etsy.com/v3/application';
export const TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
export const AUTH_URL = 'https://www.etsy.com/oauth/connect';
// shops_w is needed to create processing profiles (readiness states) from push-drafts.
export const SCOPES = ['listings_r', 'listings_w', 'shops_r', 'shops_w'];

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Add it to .env.local (see .env.example).`);
  return v;
}

// OAuth uses the keystring alone as client_id; API calls need `keystring:shared_secret`.
export const apiKey = () => requireEnv('ETSY_API_KEY');
export const apiKeyHeader = () => `${apiKey()}:${requireEnv('ETSY_SHARED_SECRET')}`;
export const redirectUri = () => `http://localhost:${process.env.ETSY_REDIRECT_PORT ?? 3003}/callback`;

// ---- PKCE ---------------------------------------------------------------

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function pkcePair() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

// ---- token storage ------------------------------------------------------

export function loadTokens() {
  if (!existsSync(TOKEN_FILE)) return null;
  return JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
}

export function saveTokens(tokens) {
  mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2) + '\n', { mode: 0o600 });
}

// Exchanges an auth code or refresh token for a fresh token set and persists it.
export async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: apiKey(), ...body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token request failed (${res.status}): ${JSON.stringify(json)}`);
  const prev = loadTokens() ?? {};
  const tokens = {
    ...prev,
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    // Etsy access tokens live 3600 s; refresh a minute early.
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
    user_id: Number(String(json.access_token).split('.')[0]),
  };
  saveTokens(tokens);
  return tokens;
}

async function freshAccessToken() {
  let tokens = loadTokens();
  if (!tokens?.refresh_token) throw new Error('Not logged in. Run: npm run etsy:auth');
  if (Date.now() >= tokens.expires_at) {
    tokens = await tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
  }
  return tokens.access_token;
}

// ---- API client ---------------------------------------------------------

export class EtsyError extends Error {
  constructor(status, body, url) {
    super(`Etsy ${status} ${url}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`);
    this.status = status;
    this.body = body;
  }
}

// `body` may be a URLSearchParams (form), FormData (multipart), or plain object (JSON).
export async function etsy(method, endpoint, body) {
  const token = await freshAccessToken();
  const headers = { 'x-api-key': apiKeyHeader(), authorization: `Bearer ${token}` };
  let payload = body;
  if (body && !(body instanceof URLSearchParams) && !(body instanceof FormData)) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const url = `${API}${endpoint}`;
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new EtsyError(res.status, json, `${method} ${endpoint}`);
  return json;
}

export async function shopId() {
  if (process.env.ETSY_SHOP_ID) return Number(process.env.ETSY_SHOP_ID);
  const tokens = loadTokens();
  if (tokens?.shop_id) return tokens.shop_id;
  const me = await etsy('GET', '/users/me');
  if (!me.shop_id) throw new Error('This Etsy account has no shop. Create the shop first, then re-run.');
  saveTokens({ ...tokens, shop_id: me.shop_id });
  return me.shop_id;
}
