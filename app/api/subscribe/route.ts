import { NextResponse } from "next/server";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/subscribe
//
// Email / SMS capture. Duplicate signups are treated as success:
// telling a stranger whether an address is already on the list
// is an enumeration oracle, and it makes the form feel broken for
// the person who forgot they signed up.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().max(32).regex(/^[+()\d\s-]*$/, "Invalid phone").optional().or(z.literal("")),
    sms_consent: z.boolean().optional(),
    email_consent: z.boolean().optional(),
    source: z.string().trim().max(48).optional(),
    /** Honeypot. A real person never sees this field. */
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: "Enter an email address or a phone number.",
  })
  .refine((v) => !v.phone || v.sms_consent === true, {
    message: "Tick the SMS consent box to receive texts.",
  });

// Per-instance limiter. Vercel runs many instances, so this caps abuse
// from one warm instance rather than acting as a global quota; the unique
// constraints in Postgres are what actually keep the table clean.
const WINDOW_MS = 60_000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function allow(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
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
    return NextResponse.json(
      publicError(parsed.error.issues[0]?.message ?? "Check the details and try again."),
      { status: 400 }
    );
  }

  // Bot filled the hidden field. Accept silently so it learns nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  if (!allow(ip)) {
    return NextResponse.json(
      publicError("Too many attempts. Try again in a minute."),
      { status: 429 }
    );
  }

  const db = serviceClient();
  if (!db) {
    logError("subscribe.no_database", new Error("service role unavailable"));
    return NextResponse.json(
      publicError("Signups are temporarily unavailable."),
      { status: 503 }
    );
  }

  const record = {
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    sms_consent: parsed.data.sms_consent === true,
    email_consent: parsed.data.email_consent !== false,
    source: parsed.data.source || "site",
  };

  const { error } = await db.from("subscribers").insert(record);

  if (error) {
    // 23505 = unique violation: already subscribed.
    if (error.code === "23505") {
      logInfo("subscribe.duplicate", { source: record.source });
      return NextResponse.json({ ok: true, already: true });
    }
    const ref = logError("subscribe.insert", error, { source: record.source });
    return NextResponse.json(
      publicError("Could not add you to the list.", ref),
      { status: 500 }
    );
  }

  logInfo("subscribe.created", { source: record.source, sms: record.sms_consent });
  return NextResponse.json({ ok: true });
}
