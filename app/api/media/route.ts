import { NextRequest, NextResponse } from "next/server";
import {
  getMediaBySource,
  getMediaCacheSize,
  setMediaItems,
  markMediaSynced,
  type MediaItem,
  postToMediaItem,
  tiktokToMediaItem,
} from "@/lib/media";
import { getCachedPosts, setCachedPosts, markSynced, getCacheSize } from "@/lib/post-cache";
import { FEATURED_TIKTOKS } from "@/lib/featured-content";

export const dynamic = "force-dynamic";

// ------------------------------------------------------------
// On-demand hydration.
// The in-memory cache does NOT survive across Vercel serverless
// instances, so a fresh request can hit an empty cache. When that
// happens we pull directly from the providers (whose fetch calls
// are cached by Next's Data Cache), then populate the cache.
// ------------------------------------------------------------
async function ensureYouTube(): Promise<void> {
  if (getCacheSize() > 0) return;
  if (!process.env.YOUTUBE_API_KEY || !process.env.YOUTUBE_UPLOADS_PLAYLIST_ID) return;
  try {
    const { fetchYouTubeUploads } = await import("@/lib/providers/youtube");
    const result = await fetchYouTubeUploads();
    if (result.posts.length > 0) {
      setCachedPosts(result.posts);
      markSynced("youtube");
    }
  } catch {
    /* non-fatal — fall back to whatever is cached */
  }
}

async function ensureTwitch(): Promise<void> {
  if (getMediaBySource("twitch").length > 0) return;
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return;
  try {
    const { getTwitchVods } = await import("@/lib/providers/twitch");
    const result = await getTwitchVods();
    if (result.items.length > 0) {
      setMediaItems(result.items);
      markMediaSynced("twitch");
    }
  } catch {
    /* non-fatal */
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source"); // "youtube" | "twitch" | "tiktok" | null for all

  // Hydrate from providers if the in-memory cache is cold
  await Promise.all([ensureYouTube(), ensureTwitch()]);

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
