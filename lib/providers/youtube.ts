import type { Post } from "@/types";

// ------------------------------------------------------------
// YOUTUBE PROVIDER — v3
// Full pagination via nextPageToken — no more 50-video cap.
// Caps at MAX_VIDEOS_PER_CHANNEL to control API quota spend.
// Two-step per page: playlistItems → videos (details + stats).
//
// Channels:
//   Main:  UCYEdpldm-qXYaT2xae1_ndQ → playlist UUYEdpldm-qXYaT2xae1_ndQ
//   Live:  UCFa90RcysqjyYzTTrK6F3IQ → playlist UUFa90RcysqjyYzTTrK6F3IQ
// ------------------------------------------------------------

export interface YouTubeFetchResult {
  posts: Post[];
  configured: boolean;
  error: string | null;
  channels_synced: number;
}

const MAX_VIDEOS_PER_CHANNEL = 200; // ~4 API pages, well within free quota

function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

function bestThumbnail(videoId: string, thumbs: any): string {
  return (
    thumbs?.maxres?.url ??
    thumbs?.high?.url ??
    thumbs?.medium?.url ??
    thumbs?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

// Enrich a batch of video IDs with duration + viewCount in one API call
async function fetchVideoDetails(
  apiKey: string,
  videoIds: string[]
): Promise<Map<string, { duration: number | null; viewCount: number | null }>> {
  const map = new Map<string, { duration: number | null; viewCount: number | null }>();
  if (!videoIds.length) return map;

  // YouTube API accepts up to 50 IDs per call
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails,statistics");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", apiKey);

    try {
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) continue;
      const json = await res.json();
      for (const item of json.items ?? []) {
        map.set(item.id, {
          duration: parseDuration(item.contentDetails?.duration),
          viewCount: item.statistics?.viewCount
            ? parseInt(item.statistics.viewCount, 10)
            : null,
        });
      }
    } catch {
      // Non-fatal — carry on without enrichment for this batch
    }
  }
  return map;
}

// Fetch all pages from one playlist, then enrich with details
async function fetchPlaylist(
  apiKey: string,
  playlistId: string,
  channelTag: string
): Promise<{ posts: Post[]; error: string | null }> {
  const allItems: any[] = [];
  let pageToken: string | null = null;

  // Page through until exhausted or cap hit
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    try {
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) {
        const text = await res.text();
        return { posts: [], error: `YouTube API ${res.status} (${channelTag}): ${text}` };
      }

      const json = await res.json();
      const page: any[] = (json.items ?? []).filter((item: any) => {
        const t = item.snippet?.title ?? "";
        return t !== "[Private video]" && t !== "[Deleted video]";
      });

      allItems.push(...page);
      pageToken = json.nextPageToken ?? null;
    } catch (err: any) {
      return { posts: [], error: err?.message ?? "Unknown error" };
    }
  } while (pageToken && allItems.length < MAX_VIDEOS_PER_CHANNEL);

  if (!allItems.length) return { posts: [], error: null };

  // Collect all video IDs, then enrich in batch
  const videoIds = allItems
    .map((item: any) => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  const details = await fetchVideoDetails(apiKey, videoIds);

  const posts: Post[] = allItems.map((item: any) => {
    const videoId: string =
      item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    const snip = item.snippet ?? {};
    const enriched = details.get(videoId);

    return {
      id: `yt_${videoId}`,
      platform: "youtube" as const,
      external_id: videoId,
      title: snip.title ?? "Untitled",
      description: snip.description ?? null,
      thumbnail_url: bestThumbnail(videoId, snip.thumbnails),
      embed_url: `https://www.youtube.com/embed/${videoId}`,
      permalink: `https://www.youtube.com/watch?v=${videoId}`,
      posted_at: snip.publishedAt ?? new Date().toISOString(),
      duration_seconds: enriched?.duration ?? null,
      view_count: enriched?.viewCount ?? null,
      visible: true,
      tags: [channelTag],
    };
  });

  return { posts, error: null };
}

export async function fetchYouTubeUploads(): Promise<YouTubeFetchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlist1 = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;
  const playlist2 = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID_2;

  if (!apiKey || !playlist1) {
    return {
      posts: [],
      configured: false,
      channels_synced: 0,
      error: "Missing YOUTUBE_API_KEY or YOUTUBE_UPLOADS_PLAYLIST_ID.",
    };
  }

  const errors: string[] = [];
  let allPosts: Post[] = [];
  let channelsSynced = 0;

  const main = await fetchPlaylist(apiKey, playlist1, "main");
  if (main.error) errors.push(main.error);
  else { allPosts = allPosts.concat(main.posts); channelsSynced++; }

  if (playlist2) {
    const live = await fetchPlaylist(apiKey, playlist2, "live");
    if (live.error) errors.push(live.error);
    else { allPosts = allPosts.concat(live.posts); channelsSynced++; }
  }

  // Deduplicate by post ID
  const seen = new Set<string>();
  const unique = allPosts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Newest first
  unique.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

  return {
    posts: unique,
    configured: true,
    channels_synced: channelsSynced,
    error: errors.length ? errors.join(" | ") : null,
  };
}
