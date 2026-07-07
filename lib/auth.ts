// Works in both the Node.js runtime (API routes) and the Edge runtime
// (middleware) since it only uses Web Crypto, never Node's `crypto` module
// or `Buffer`.

const SALT = 'trishare-local-salt-v1';

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + SALT);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(digest);
}

export const AUTH_COOKIE_NAME = 'trishare_auth';

export async function expectedCookieValue(): Promise<string> {
  const pw = process.env.SITE_PASSWORD || '';
  return hashPassword(pw);
}
