import { NextResponse } from "next/server";
import { getTwitchLiveStatus, type TwitchLiveStatus } from "@/lib/providers/twitch";
import { WD } from "@/lib/wockkingdagger";

export const dynamic = "force-dynamic";

// Light server-side cache — re-checks every 30s max
// Prevents hammering Twitch API on every SSR request
declare global {
  // eslint-disable-next-line no-var
  var __liveCache: { status: TwitchLiveStatus; checkedAt: number } | null;
}
globalThis.__liveCache = globalThis.__liveCache ?? null;
const LIVE_CACHE_TTL = 30_000; // 30 seconds

export interface LiveResponse {
  isLive: boolean;
  channelLogin: string;
  title: string | null;
  game: string | null;
  viewerCount: number | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
  configured: boolean;
  error: string | null;
  checkedAt: string;
  // Client builds embed URL using NEXT_PUBLIC_TWITCH_PARENT_DOMAIN
}

export async function GET(): Promise<NextResponse<LiveResponse>> {
  // Serve from cache if fresh
  if (
    globalThis.__liveCache &&
    Date.now() - globalThis.__liveCache.checkedAt < LIVE_CACHE_TTL
  ) {
    const cached = globalThis.__liveCache.status;
    return NextResponse.json({
      isLive: cached.isLive,
      channelLogin: cached.channelLogin,
      title: cached.title,
      game: cached.game,
      viewerCount: cached.viewerCount,
      thumbnailUrl: cached.thumbnailUrl,
      startedAt: cached.startedAt,
      configured: cached.configured,
      error: cached.error,
      checkedAt: new Date(globalThis.__liveCache.checkedAt).toISOString(),
    });
  }

  const status = await getTwitchLiveStatus();

  globalThis.__liveCache = { status, checkedAt: Date.now() };

  return NextResponse.json({
    isLive: status.isLive,
    channelLogin: status.channelLogin,
    title: status.title,
    game: status.game,
    viewerCount: status.viewerCount,
    thumbnailUrl: status.thumbnailUrl,
    startedAt: status.startedAt,
    configured: status.configured,
    error: status.error,
    checkedAt: new Date().toISOString(),
  });
}
