import { NextRequest, NextResponse } from "next/server";
import { getAllMediaItems, getMediaBySource, type MediaItem, postToMediaItem, tiktokToMediaItem } from "@/lib/media";
import { getCachedPosts } from "@/lib/post-cache";
import { FEATURED_TIKTOKS } from "@/lib/featured-content";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source"); // "youtube" | "twitch" | "tiktok" | null for all

  // YouTube: pull from post-cache and convert
  const ytPosts = getCachedPosts();
  const ytItems: MediaItem[] = ytPosts
    .filter((p) => p.platform === "youtube")
    .map(postToMediaItem);

  // Twitch: pull from media cache
  const twitchItems = getMediaBySource("twitch");

  // TikTok: always served from featured-content (no API required)
  const tiktokItems: MediaItem[] = FEATURED_TIKTOKS.map(tiktokToMediaItem);

  // Combine, deduplicate by ID, sort newest first
  const all = [...ytItems, ...twitchItems, ...tiktokItems];
  const seen = new Set<string>();
  const unique = all
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    );

  const filtered = source
    ? unique.filter((m) => m.source === source)
    : unique;

  return NextResponse.json({
    items: filtered,
    count: filtered.length,
    sources: {
      youtube: unique.filter((m) => m.source === "youtube").length,
      twitch: unique.filter((m) => m.source === "twitch").length,
      tiktok: unique.filter((m) => m.source === "tiktok").length,
    },
  });
}
