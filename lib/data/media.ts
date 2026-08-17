import "server-only";
import { unstable_cache } from "next/cache";
import { readClient, TAGS } from "@/lib/supabase";
import { logError } from "@/lib/log";
import type { LiveStatus, MediaItem, MediaSource } from "@/types";

// ============================================================
// MEDIA READS
//
// The archive is served from Postgres, populated by cron. No
// page render ever calls YouTube or Twitch: a provider outage
// makes the archive stale, not unavailable.
// ============================================================

const CACHE_SECONDS = 300;

const MEDIA_SELECT =
  "id,source,kind,external_id,title,description,thumbnail_url,permalink,embed_url," +
  "published_at,duration_seconds,view_count,visible,synced_at";

export const getMediaItems = unstable_cache(
  async (): Promise<MediaItem[]> => {
    const db = readClient();
    if (!db) return [];
    const { data, error } = await db
      .from("media_items")
      .select(MEDIA_SELECT)
      .eq("visible", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(500);

    if (error) {
      logError("media.getMediaItems", error);
      return [];
    }
    return (data ?? []) as unknown as MediaItem[];
  },
  ["media:all"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.media] }
);

export async function getMediaBySource(source: MediaSource): Promise<MediaItem[]> {
  const items = await getMediaItems();
  return items.filter((i) => i.source === source);
}

export async function getMediaItem(
  source: MediaSource,
  externalId: string
): Promise<MediaItem | null> {
  const items = await getMediaItems();
  return items.find((i) => i.source === source && i.external_id === externalId) ?? null;
}

/** Same source, nearest in time — the "keep watching" rail. */
export async function getRelatedMedia(item: MediaItem, limit = 6): Promise<MediaItem[]> {
  const items = await getMediaItems();
  return items.filter((i) => i.id !== item.id && i.source === item.source).slice(0, limit);
}

export interface MediaCounts {
  all: number;
  youtube: number;
  twitch: number;
  tiktok: number;
  instagram: number;
}

export async function getMediaCounts(): Promise<MediaCounts> {
  const items = await getMediaItems();
  return {
    all: items.length,
    youtube: items.filter((i) => i.source === "youtube").length,
    twitch: items.filter((i) => i.source === "twitch").length,
    tiktok: items.filter((i) => i.source === "tiktok").length,
    instagram: items.filter((i) => i.source === "instagram").length,
  };
}

// ------------------------------------------------------------
// LIVE STATUS
// One row, refreshed by cron every few minutes. Read from the
// database so nothing in the page path waits on Twitch.
// ------------------------------------------------------------

export const getLiveStatus = unstable_cache(
  async (): Promise<LiveStatus | null> => {
    const db = readClient();
    if (!db) return null;
    const { data, error } = await db
      .from("live_status")
      .select("is_live,platform,channel,title,game,viewer_count,started_at,checked_at")
      .eq("id", true)
      .maybeSingle();

    if (error) {
      logError("media.getLiveStatus", error);
      return null;
    }
    return (data as unknown as LiveStatus | null) ?? null;
  },
  ["media:live"],
  { revalidate: 60, tags: [TAGS.live] }
);
