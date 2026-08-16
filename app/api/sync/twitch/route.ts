import { NextResponse } from "next/server";
import { getTwitchVods } from "@/lib/providers/twitch";
import { setMediaItems, markMediaSynced, getMediaCacheSize } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await getTwitchVods(50);

  if (!result.configured) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: result.error,
      hint: "Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env.local",
    });
  }

  if (result.error && result.items.length === 0) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  // Write to unified media cache
  setMediaItems(result.items);
  markMediaSynced("twitch");

  return NextResponse.json({
    ok: true,
    configured: true,
    synced: result.items.length,
    cache_size: getMediaCacheSize(),
    errors: result.error ?? null,
    preview: result.items.slice(0, 3).map((v) => ({
      title: v.title,
      publishedAt: v.publishedAt,
      duration: v.duration,
      url: v.url,
    })),
  });
}
