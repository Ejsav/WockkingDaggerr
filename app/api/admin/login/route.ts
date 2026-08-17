import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuthConfigured, createSessionToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { logInfo, logWarn, publicError } from "@/lib/log";

// ============================================================
// POST /api/admin/login
// The one endpoint under /api/admin that middleware lets through
// unauthenticated. Rate limited, constant-time compared, and it
// never reveals whether the password merely was wrong or whether
// admin auth is switched off.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  password: z.string().min(1).max(200),
  next: z.string().max(200).optional(),
});

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

function allow(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

/** Only same-origin relative paths — never an open redirect. */
function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(publicError("Invalid request body"), { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(publicError("Enter a passcode."), { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  if (!allow(ip)) {
    logWarn("admin.login.rate_limited", { ip });
    return NextResponse.json(
      publicError("Too many attempts. Try again later."),
      { status: 429 }
    );
  }

  if (!adminAuthConfigured()) {
    logWarn("admin.login.unconfigured");
    return NextResponse.json(publicError("Sign-in unavailable."), { status: 503 });
  }

  if (!(await verifyPassword(parsed.data.password))) {
    logWarn("admin.login.failed", { ip });
    return NextResponse.json(publicError("Incorrect passcode."), { status: 401 });
  }

  const { token, maxAge } = await createSessionToken();
  const res = NextResponse.json({ ok: true, redirect: safeNext(parsed.data.next) });
  res.cookies.set({ ...sessionCookieOptions(maxAge), value: token });
  logInfo("admin.login.ok", { ip });
  return res;
}
