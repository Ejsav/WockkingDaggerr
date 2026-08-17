import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { WD } from "@/lib/wockkingdagger";
import type { MediaItem } from "@/types";
import { failed, skipped, type ProviderResult } from "@/lib/providers/types";

// ============================================================
// TIKTOK — Display API (video.list)
//
// Requires an approved developer app and a token with the
// video.list scope. Without one this returns `configured: false`
// and the archive simply has no TikTok rows — the site links to
// the public profile instead of pretending to hold the content.
// ============================================================

const ENDPOINT = "https://open.tiktokapis.com/v2/video/list/";
const FIELDS = [
  "id",
  "title",
  "video_description",
  "cover_image_url",
  "share_url",
  "embed_link",
  "duration",
  "view_count",
  "create_time",
].join(",");

interface TikTokVideo {
  id?: string;
  title?: string;
  video_description?: string;
  cover_image_url?: string;
  share_url?: string;
  embed_link?: string;
  duration?: number;
  view_count?: number;
  create_time?: number;
}

export async function fetchTikTok(): Promise<ProviderResult> {
  const token = serverEnv.tiktokAccessToken;
  if (!token) return skipped("TIKTOK_ACCESS_TOKEN not set");

  const items: MediaItem[] = [];
  let cursor: number | undefined;
  let hasMore = true;
  let pages = 0;

  try {
    while (hasMore && pages < 5) {
      const res = await fetchWithTimeout(`${ENDPOINT}?fields=${FIELDS}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
        timeoutMs: 8000,
      });

      if (!res.ok) return failed(`tiktok video.list: HTTP ${res.status}`);

      const json = (await res.json()) as {
        data?: { videos?: TikTokVideo[]; cursor?: number; has_more?: boolean };
        error?: { code?: string; message?: string };
      };

      if (json.error?.code && json.error.code !== "ok") {
        return failed(`tiktok video.list: ${json.error.code}`);
      }

      for (const v of json.data?.videos ?? []) {
        if (!v.id) continue;
        items.push({
          id: `tiktok:${v.id}`,
          source: "tiktok",
          kind: "short",
          external_id: v.id,
          title: (v.title || v.video_description || "").trim() || `${WD.tiktok.handle} on TikTok`,
          description: v.video_description?.trim() || null,
          thumbnail_url: v.cover_image_url ?? null,
          permalink: v.share_url ?? `${WD.tiktok.profileUrl}/video/${v.id}`,
          embed_url: v.embed_link ?? null,
          published_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
          duration_seconds: typeof v.duration === "number" ? Math.round(v.duration) : null,
          view_count: typeof v.view_count === "number" ? v.view_count : null,
          visible: true,
          synced_at: new Date().toISOString(),
        });
      }

      cursor = json.data?.cursor;
      hasMore = Boolean(json.data?.has_more && cursor);
      pages += 1;
    }
  } catch (err) {
    return failed((err as Error).message);
  }

  return { items, configured: true, error: null };
}
