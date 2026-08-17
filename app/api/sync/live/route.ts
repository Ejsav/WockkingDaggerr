import { NextResponse } from "next/server";
import { authorizeSync } from "@/lib/auth";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { fetchTwitchLiveStatus } from "@/lib/providers/twitch";
import { recordRun } from "@/lib/sync";
import { logError } from "@/lib/log";

// ============================================================
// POST|GET /api/sync/live
//
// Refreshes the single live_status row. Pages read that row, so
// nothing in a page render waits on Twitch, and no client polls
// an endpoint that hits a third party.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: Request): Promise<NextResponse> {
  if (!(await authorizeSync(req))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  const startedAt = Date.now();
  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Supabase service role not configured" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  const probe = await fetchTwitchLiveStatus();

  if (!probe.configured) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "Twitch credentials not set" },
      { headers: { "cache-control": "no-store" } }
    );
  }

  // A failed probe must not flip the banner to "offline" — that would
  // hide a real stream because of a transient API error.
  if (!probe.status) {
    await recordRun({
      source: "live", ok: false, skipped: false, items: 0, removed: 0,
      durationMs: Date.now() - startedAt, error: probe.error,
    });
    return NextResponse.json(
      { ok: false, error: "Live probe failed; previous status retained" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }

  const { error } = await db
    .from("live_status")
    .update({ ...probe.status, checked_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    const ref = logError("sync.live.update", error);
    return NextResponse.json(
      { ok: false, error: "Could not persist live status", ref },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  await recordRun({
    source: "live", ok: true, skipped: false, items: probe.status.is_live ? 1 : 0,
    removed: 0, durationMs: Date.now() - startedAt, error: null,
  });

  invalidate(TAGS.live);

  return NextResponse.json(
    { ok: true, is_live: probe.status.is_live },
    { headers: { "cache-control": "no-store" } }
  );
}

export const POST = handle;
export const GET = handle;
