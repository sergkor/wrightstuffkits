// One-time OAuth 2.0 (PKCE) login for the Etsy scripts. Opens the consent page,
// catches the redirect on localhost, and stores tokens in .etsy/tokens.json.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { AUTH_URL, SCOPES, apiKey, pkcePair, redirectUri, shopId, tokenRequest } from './lib.mjs';

const { verifier, challenge } = pkcePair();
const state = randomBytes(8).toString('hex');
const redirect = redirectUri();
const port = Number(new URL(redirect).port);

const url = new URL(AUTH_URL);
url.search = new URLSearchParams({
  response_type: 'code',
  client_id: apiKey(),
  redirect_uri: redirect,
  scope: SCOPES.join(' '),
  state,
  code_challenge: challenge,
  code_challenge_method: 'S256',
}).toString();

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const u = new URL(req.url, redirect);
    if (u.pathname !== '/callback') {
      res.writeHead(404).end();
      return;
    }
    const err = u.searchParams.get('error');
    if (err || u.searchParams.get('state') !== state) {
      res.writeHead(400, { 'content-type': 'text/plain' }).end(`Login failed: ${err ?? 'state mismatch'}`);
      server.close();
      reject(new Error(err ?? 'state mismatch'));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain' }).end('Etsy login complete. You can close this tab.');
    server.close();
    resolve(u.searchParams.get('code'));
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`\nMake sure ${redirect} is listed as a Callback URL in your Etsy app settings.\n`);
    console.log('Opening Etsy consent page. If the browser does not open, paste this URL:\n');
    console.log(url.toString(), '\n');
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    execFile(opener, [url.toString()], () => {});
  });
});

await tokenRequest({ grant_type: 'authorization_code', redirect_uri: redirect, code, code_verifier: verifier });
const id = await shopId();
console.log(`Logged in. shop_id=${id}. Tokens saved to .etsy/tokens.json (gitignored).`);
console.log('Next: npm run etsy:lookup  (to find taxonomy, shipping profile, and return policy IDs)');
