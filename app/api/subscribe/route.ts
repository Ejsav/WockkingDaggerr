import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ------------------------------------------------------------
// Naive in-memory rate limit. For production swap to Upstash
// Ratelimit or a Redis-backed limiter so it survives server restarts
// and scales across instances.
// ------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key) ?? [];
  const fresh = entry.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    hits.set(key, fresh);
    return false;
  }
  fresh.push(now);
  hits.set(key, fresh);
  return true;
}

interface SubscribeBody {
  email?: string | null;
  phone?: string | null;
  sms_consent?: boolean;
  email_consent?: boolean;
  source?: string;
  // Honeypot — bots will fill this. Humans never see it.
  website?: string;
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Honeypot trap — bot caught
  if (body.website) {
    return NextResponse.json({ ok: true }); // Lie quietly
  }

  // Basic rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  // Validate
  const email = body.email?.trim().toLowerCase() || null;
  const phone = body.phone?.trim() || null;

  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (phone && !body.sms_consent) {
    return NextResponse.json(
      { error: "SMS consent required to subscribe a phone number." },
      { status: 400 }
    );
  }

  const record = {
    email,
    phone,
    sms_consent: !!body.sms_consent,
    email_consent: body.email_consent !== false,
    source: body.source || "site",
    created_at: new Date().toISOString(),
  };

  // Persist if Supabase is configured, otherwise log + accept
  if (SUPABASE_CONFIGURED) {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase service not configured" }, { status: 500 });
    }
    const { error } = await supabase.from("subscribers").insert(record);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Mock mode — write to server logs for visibility during dev
    console.log("[SUBSCRIBE — mock mode]", record);
  }

  return NextResponse.json({ ok: true });
}
