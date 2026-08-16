// ============================================================
// UNIFIED MEDIA MODEL
// Combines YouTube uploads, Twitch VODs, and TikTok videos
// into one shape. The /watch page reads from this layer.
// ============================================================

export interface MediaItem {
  id: string;                              // "yt_{id}" | "twitch_{id}" | "tiktok_{id}"
  source: "youtube" | "twitch" | "tiktok";
  type: "video" | "vod" | "live";
  title: string;
  description: string | null;
  thumbnail: string | null;
  publishedAt: string | null;
  duration: number | null;               // seconds
  viewCount: number | null;
  url: string;                           // canonical platform URL
  embedUrl: string | null;               // iframe-ready URL
  platformLabel: "YouTube" | "Twitch" | "TikTok";
  externalId: string;                    // raw platform video/VOD/video ID
}

// ------------------------------------------------------------
// CACHE — Twitch VODs (YouTube lives in post-cache separately)
// ------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __wdMediaCache: Map<string, MediaItem> | undefined;
  // eslint-disable-next-line no-var
  var __wdMediaSyncedAt: Record<string, number> | undefined;
}

function getMediaCache(): Map<string, MediaItem> {
  if (!globalThis.__wdMediaCache) globalThis.__wdMediaCache = new Map();
  return globalThis.__wdMediaCache;
}

function getMediaSyncedAt(): Record<string, number> {
  if (!globalThis.__wdMediaSyncedAt) globalThis.__wdMediaSyncedAt = {};
  return globalThis.__wdMediaSyncedAt;
}

export function setMediaItems(items: MediaItem[]): void {
  const cache = getMediaCache();
  for (const item of items) cache.set(item.id, item);
}

export function markMediaSynced(source: string): void {
  getMediaSyncedAt()[source] = Date.now();
}

export function wasMediaSyncedRecently(source: string, withinMs = 3_600_000): boolean {
  const last = getMediaSyncedAt()[source];
  return last !== undefined && Date.now() - last < withinMs;
}

export function getMediaItem(id: string): MediaItem | null {
  return getMediaCache().get(id) ?? null;
}

export function getAllMediaItems(): MediaItem[] {
  return Array.from(getMediaCache().values()).sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
  );
}

export function getMediaBySource(source: MediaItem["source"]): MediaItem[] {
  return getAllMediaItems().filter((m) => m.source === source);
}

export function getMediaCacheSize(): number {
  return getMediaCache().size;
}

// Convert legacy Post shape (from post-cache) to MediaItem
import type { Post } from "@/types";

export function postToMediaItem(post: Post): MediaItem {
  return {
    id: `yt_${post.external_id}`,
    source: "youtube",
    type: "video",
    title: post.title,
    description: post.description,
    thumbnail: post.thumbnail_url,
    publishedAt: post.posted_at,
    duration: post.duration_seconds,
    viewCount: post.view_count,
    url: post.permalink ?? `https://youtube.com/watch?v=${post.external_id}`,
    embedUrl: `https://www.youtube.com/embed/${post.external_id}`,
    platformLabel: "YouTube",
    externalId: post.external_id,
  };
}

// Convert FEATURED_TIKTOKS entries to MediaItems
import type { FeaturedTikTok } from "@/lib/featured-content";

export function tiktokToMediaItem(video: FeaturedTikTok): MediaItem {
  return {
    id: `tiktok_${video.videoId}`,
    source: "tiktok",
    type: "video",
    title: video.caption
      ? `@wockkingdaggerr — ${video.caption}`
      : `@wockkingdaggerr TikTok`,
    description: null,
    thumbnail: null,
    publishedAt: null,
    duration: null,
    viewCount: null,
    url: video.url,
    embedUrl: null, // TikTok uses embed.js, not a direct iframe src
    platformLabel: "TikTok",
    externalId: video.videoId,
  };
}
