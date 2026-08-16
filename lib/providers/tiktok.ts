import type { Post } from "@/types";
import { WD } from "@/lib/wockkingdagger";

// ------------------------------------------------------------
// TIKTOK PROVIDER
// Uses the TikTok Display API video list endpoint. Requires
// app approval through the TikTok Developer portal and a valid
// access token with the video.list scope.
//
// API SETUP REQUIRED:
//   1. Create a TikTok Developer app at developers.tiktok.com
//   2. Request the video.list permission scope
//   3. Complete app review (takes 1–4 weeks)
//   4. Generate an access token for @wockkingdaggerr
//   5. Set TIKTOK_ACCESS_TOKEN in .env.local
//
// WITHOUT CREDENTIALS:
//   The site still shows a polished TikTok section using the
//   official public profile link and configured featured videos
//   from lib/featured-content.ts. Users cannot tell the
//   difference between API-connected and embed-based content.
//
// Username: wockkingdaggerr (two r's)
// Profile:  https://tiktok.com/@wockkingdaggerr
// ------------------------------------------------------------

export interface TikTokFetchResult {
  posts: Post[];
  configured: boolean;
  error: string | null;
}

export async function fetchTikTokVideos(): Promise<TikTokFetchResult> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const handle = WD.tiktok.handle; // @wockkingdaggerr

  if (!accessToken) {
    console.log(`[tiktok] No TIKTOK_ACCESS_TOKEN — using featured content fallback for ${handle}`);
    return {
      posts: [],
      configured: false,
      error: "Missing TIKTOK_ACCESS_TOKEN. Add featured videos in lib/featured-content.ts for manual content.",
    };
  }

  const url = "https://open.tiktokapis.com/v2/video/list/";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_count: 20,
        fields: [
          "id",
          "title",
          "video_description",
          "cover_image_url",
          "embed_link",
          "share_url",
          "create_time",
          "duration",
          "view_count",
        ],
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[tiktok] API error ${res.status}:`, text);
      return { posts: [], configured: true, error: `TikTok API ${res.status}` };
    }

    const json = await res.json();
    const videos: any[] = json?.data?.videos ?? [];

    const posts: Post[] = videos.map((v) => ({
      id: `tt_${v.id}`,
      platform: "tiktok" as const,
      external_id: String(v.id),
      title: v.title || v.video_description || "TikTok",
      description: v.video_description ?? null,
      thumbnail_url: v.cover_image_url ?? null,
      embed_url: v.embed_link ?? `https://www.tiktok.com/embed/v2/${v.id}`,
      permalink: v.share_url ?? `https://www.tiktok.com/${handle}/video/${v.id}`,
      posted_at: v.create_time
        ? new Date(Number(v.create_time) * 1000).toISOString()
        : new Date().toISOString(),
      duration_seconds: v.duration ?? null,
      view_count: v.view_count ?? null,
      visible: true,
      tags: [],
    }));

    console.log(`[tiktok] Fetched ${posts.length} videos for ${handle}`);
    return { posts, configured: true, error: null };
  } catch (err: any) {
    console.error("[tiktok] Fetch failed:", err?.message);
    return { posts: [], configured: true, error: err?.message ?? "Unknown error" };
  }
}
