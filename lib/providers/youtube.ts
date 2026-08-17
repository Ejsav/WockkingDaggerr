import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { parseIsoDuration } from "@/lib/utils";
import type { MediaItem } from "@/types";
import { failed, skipped, type ProviderResult } from "@/lib/providers/types";

// ============================================================
// YOUTUBE — Data API v3
//
// Full pagination over the uploads playlist (nextPageToken), then
// a batched enrichment pass for duration and view count. Both
// channels are synced in one run and deduplicated.
//
// This runs only from cron. Quota spend is bounded by
// MAX_VIDEOS_PER_CHANNEL and every call has a timeout.
// ============================================================

const MAX_VIDEOS_PER_CHANNEL = 200;
const API = "https://www.googleapis.com/youtube/v3";

interface PlaylistItem {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

function bestThumbnail(videoId: string, thumbs: PlaylistItem["snippet"] extends infer S ? (S extends { thumbnails?: infer T } ? T : never) : never): string {
  const t = thumbs as Record<string, { url?: string } | undefined> | undefined;
  return (
    t?.maxres?.url ??
    t?.standard?.url ??
    t?.high?.url ??
    t?.medium?.url ??
    t?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

/** Duration + statistics for up to 50 ids per call. Non-fatal on failure. */
async function fetchDetails(
  apiKey: string,
  ids: string[]
): Promise<Map<string, { duration: number | null; views: number | null }>> {
  const out = new Map<string, { duration: number | null; views: number | null }>();

  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL(`${API}/videos`);
    url.searchParams.set("part", "contentDetails,statistics");
    url.searchParams.set("id", ids.slice(i, i + 50).join(","));
    url.searchParams.set("key", apiKey);

    try {
      const res = await fetchWithTimeout(url.toString(), { timeoutMs: 8000 });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        items?: Array<{
          id: string;
          contentDetails?: { duration?: string };
          statistics?: { viewCount?: string };
        }>;
      };
      for (const item of json.items ?? []) {
        const views = item.statistics?.viewCount
          ? Number.parseInt(item.statistics.viewCount, 10)
          : null;
        out.set(item.id, {
          duration: parseIsoDuration(item.contentDetails?.duration),
          views: Number.isFinite(views as number) ? views : null,
        });
      }
    } catch {
      // Enrichment is best-effort: a video without a duration is still a video.
    }
  }

  return out;
}

async function fetchPlaylist(
  apiKey: string,
  playlistId: string
): Promise<{ items: MediaItem[]; error: string | null }> {
  const raw: PlaylistItem[] = [];
  let pageToken: string | null = null;

  do {
    const url = new URL(`${API}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    let res: Response;
    try {
      res = await fetchWithTimeout(url.toString(), { timeoutMs: 8000 });
    } catch (err) {
      return { items: [], error: `youtube playlist ${playlistId}: ${(err as Error).message}` };
    }

    if (!res.ok) {
      return { items: [], error: `youtube playlist ${playlistId}: HTTP ${res.status}` };
    }

    const json = (await res.json()) as { items?: PlaylistItem[]; nextPageToken?: string };
    for (const item of json.items ?? []) {
      const title = item.snippet?.title ?? "";
      // Private and deleted entries stay in the playlist but have no playable video.
      if (title === "Private video" || title === "Deleted video" || title === "[Private video]") {
        continue;
      }
      raw.push(item);
    }
    pageToken = json.nextPageToken ?? null;
  } while (pageToken && raw.length < MAX_VIDEOS_PER_CHANNEL);

  const ids = raw
    .map((i) => i.contentDetails?.videoId ?? i.snippet?.resourceId?.videoId)
    .filter((id): id is string => Boolean(id));

  const details = await fetchDetails(apiKey, ids);

  const items: MediaItem[] = raw.flatMap((item) => {
    const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!videoId) return [];
    const snippet = item.snippet ?? {};
    const enriched = details.get(videoId);
    const duration = enriched?.duration ?? null;

    return [
      {
        id: `youtube:${videoId}`,
        source: "youtube" as const,
        // Shorts are 60 seconds or less; the archive filters on this.
        kind: duration !== null && duration > 0 && duration <= 60 ? ("short" as const) : ("video" as const),
        external_id: videoId,
        title: snippet.title ?? "Untitled",
        description: snippet.description?.trim() || null,
        thumbnail_url: bestThumbnail(videoId, snippet.thumbnails as never),
        permalink: `https://www.youtube.com/watch?v=${videoId}`,
        embed_url: `https://www.youtube-nocookie.com/embed/${videoId}`,
        published_at:
          item.contentDetails?.videoPublishedAt ?? snippet.publishedAt ?? null,
        duration_seconds: duration,
        view_count: enriched?.views ?? null,
        visible: true,
        synced_at: new Date().toISOString(),
      },
    ];
  });

  return { items, error: null };
}

export async function fetchYouTube(): Promise<ProviderResult> {
  const apiKey = serverEnv.youtubeApiKey;
  const playlists = serverEnv.youtubePlaylists;

  if (!apiKey || playlists.length === 0) {
    return skipped("YOUTUBE_API_KEY or YOUTUBE_UPLOADS_PLAYLIST_ID not set");
  }

  const errors: string[] = [];
  const byId = new Map<string, MediaItem>();

  for (const playlistId of playlists) {
    const { items, error } = await fetchPlaylist(apiKey, playlistId);
    if (error) errors.push(error);
    for (const item of items) byId.set(item.id, item);
  }

  const items = Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
  );

  // Every playlist failed and nothing came back — that is a real failure.
  if (items.length === 0 && errors.length > 0) return failed(errors.join(" | "));

  return { items, configured: true, error: errors.length ? errors.join(" | ") : null };
}
