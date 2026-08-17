// ============================================================
// ADMIN AUTHENTICATION
//
// Model: a single operator account. The password lives in
// ADMIN_PASSWORD (server-only). A successful sign-in mints a
// stateless session token — `expiry.nonce.HMAC-SHA256` — signed
// with ADMIN_SESSION_SECRET and stored in an httpOnly, SameSite
// =Lax, Secure cookie.
//
// Why stateless: the token is verifiable in edge middleware with
// no database round-trip, so /admin is gated before any admin
// markup is generated — not after it reaches the browser.
//
// Everything here uses Web Crypto only, so the identical code
// runs in middleware (edge), route handlers, and server
// components.
// ============================================================

import { serverEnv, adminAuthConfigured } from "@/lib/env";

export const ADMIN_COOKIE = "wd_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

/**
 * Constant-time string comparison. A `===` here leaks the length of
 * the matching prefix through timing, which is enough to recover a
 * signature one byte at a time.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Compare against a fixed-length digest of each side so that unequal
  // lengths cost the same as equal ones.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/** Verify a submitted password against ADMIN_PASSWORD. */
export async function verifyPassword(submitted: string): Promise<boolean> {
  const expected = serverEnv.adminPassword;
  if (!expected) return false;
  // Hash both sides first so the comparison is over fixed-length digests.
  const secret = serverEnv.adminSessionSecret ?? "";
  const [a, b] = await Promise.all([
    hmac(secret, `pw:${submitted}`),
    hmac(secret, `pw:${expected}`),
  ]);
  return timingSafeEqual(a, b);
}

/** Mint a signed session token. Caller sets it as an httpOnly cookie. */
export async function createSessionToken(): Promise<{ token: string; maxAge: number }> {
  const secret = serverEnv.adminSessionSecret;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = `${expiresAt}.${nonce}`;
  const signature = await hmac(secret, payload);
  return { token: `${payload}.${signature}`, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

/**
 * Validate a session token: correct shape, unexpired, and signed by us.
 * Runs in edge middleware — no I/O, no Node built-ins.
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = serverEnv.adminSessionSecret;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiryRaw, nonce, signature] = parts;

  const expected = await hmac(secret, `${expiryRaw}.${nonce}`);
  if (!timingSafeEqual(signature, expected)) return false;

  const expiresAt = Number(expiryRaw);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

/**
 * Authorization for machine callers of /api/sync/*.
 * Accepts either the Vercel Cron bearer token (CRON_SECRET) or a
 * valid admin session cookie, so the operator can force a sync from
 * the control room without a second credential.
 */
export async function authorizeSync(req: Request): Promise<boolean> {
  const cronSecret = serverEnv.cronSecret;
  if (cronSecret) {
    const header = req.headers.get("authorization") ?? "";
    const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (presented) {
      const secret = serverEnv.adminSessionSecret ?? cronSecret;
      const [a, b] = await Promise.all([
        hmac(secret, `cron:${presented}`),
        hmac(secret, `cron:${cronSecret}`),
      ]);
      if (timingSafeEqual(a, b)) return true;
    }
  }

  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}

/** Cookie attributes shared by the login and logout routes. */
export function sessionCookieOptions(maxAge: number) {
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export { adminAuthConfigured };
