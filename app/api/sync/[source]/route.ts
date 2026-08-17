import { NextResponse } from "next/server";
import { authorizeSync } from "@/lib/auth";
import { runMediaSync, sweepReservations, type SyncOutcome } from "@/lib/sync";
import { fetchYouTube } from "@/lib/providers/youtube";
import { fetchTwitchVods } from "@/lib/providers/twitch";
import { fetchTikTok } from "@/lib/providers/tiktok";
import { fetchInstagram } from "@/lib/providers/instagram";
import type { MediaSource } from "@/types";
import type { ProviderResult } from "@/lib/providers/types";

// ============================================================
// POST /api/sync/{youtube|twitch|tiktok|instagram|all}
//
// The only path that talks to a content provider. Requires the
// Vercel Cron bearer token or a signed admin session — a browser
// visit without either gets 401 and never reaches a provider.
//
// GET is also accepted because Vercel Cron issues GET requests.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const PROVIDERS: Record<MediaSource, () => Promise<ProviderResult>> = {
  youtube: fetchYouTube,
  twitch: fetchTwitchVods,
  tiktok: fetchTikTok,
  instagram: fetchInstagram,
};

const VALID = new Set([...Object.keys(PROVIDERS), "all"]);

async function handle(req: Request, source: string): Promise<NextResponse> {
  if (!(await authorizeSync(req))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  if (!VALID.has(source)) {
    return NextResponse.json({ error: "Unknown sync source" }, { status: 404 });
  }

  const targets =
    source === "all" ? (Object.keys(PROVIDERS) as MediaSource[]) : [source as MediaSource];

  const results: SyncOutcome[] = [];
  for (const target of targets) {
    results.push(await runMediaSync(target, PROVIDERS[target]));
  }

  const swept = await sweepReservations();

  return NextResponse.json(
    {
      ok: results.every((r) => r.ok),
      reservations_released: swept,
      results: results.map((r) => ({
        source: r.source,
        ok: r.ok,
        skipped: r.skipped,
        items: r.items,
        removed: r.removed,
        duration_ms: r.durationMs,
        // `error` here is our own summary string, never raw provider or database text.
        error: r.error,
      })),
    },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  return handle(req, (await params).source);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  return handle(req, (await params).source);
}
