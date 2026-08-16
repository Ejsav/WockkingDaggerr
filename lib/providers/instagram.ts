import type { Post } from "@/types";
import { WD } from "@/lib/wockkingdagger";

// ------------------------------------------------------------
// INSTAGRAM PROVIDER
// Uses the Instagram Graph API media endpoint. Requires a
// Business or Creator account, a Facebook app, and a long-lived
// access token. Tokens expire every 60 days — refresh before
// they lapse or the site falls back to featured content.
//
// API SETUP REQUIRED:
//   1. Convert @wockkingdaggerr to a Creator or Business account
//   2. Create a Facebook Developer app at developers.facebook.com
//   3. Add Instagram Basic Display or Graph API product
//   4. Generate a long-lived access token for @wockkingdaggerr
//   5. Store INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN in .env.local
//   6. Set up a cron job to refresh the token every 50 days
//
// WITHOUT CREDENTIALS:
//   The site shows a polished Instagram section using the official
//   public profile link and configured featured posts from
//   lib/featured-content.ts.
//
// Username: wockkingdaggerr (two r's)
// Profile:  https://instagram.com/wockkingdaggerr
// ------------------------------------------------------------

export interface InstagramFetchResult {
  posts: Post[];
  configured: boolean;
  error: string | null;
}

export async function fetchInstagramMedia(): Promise<InstagramFetchResult> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  const handle = WD.instagram.handle; // @wockkingdaggerr

  if (!accessToken || !userId) {
    console.log(`[instagram] No credentials — using featured content fallback for ${handle}`);
    return {
      posts: [],
      configured: false,
      error: "Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID. Add featured posts in lib/featured-content.ts.",
    };
  }

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
  ].join(",");

  const url = `https://graph.instagram.com/v21.0/${userId}/media?fields=${fields}&access_token=${accessToken}&limit=20`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[instagram] API error ${res.status}:`, text);
      return { posts: [], configured: true, error: `Instagram API ${res.status}` };
    }

    const json = await res.json();
    const items: any[] = json?.data ?? [];

    const posts: Post[] = items.map((m) => ({
      id: `ig_${m.id}`,
      platform: "instagram" as const,
      external_id: String(m.id),
      title: (m.caption ?? "").split("\n")[0]?.slice(0, 120) || "Instagram",
      description: m.caption ?? null,
      thumbnail_url: m.thumbnail_url ?? m.media_url ?? null,
      embed_url: m.permalink ? `${m.permalink}embed/` : null,
      permalink: m.permalink ?? null,
      posted_at: m.timestamp ?? new Date().toISOString(),
      duration_seconds: null,
      view_count: null,
      visible: true,
      tags: [],
    }));

    console.log(`[instagram] Fetched ${posts.length} posts for ${handle}`);
    return { posts, configured: true, error: null };
  } catch (err: any) {
    console.error("[instagram] Fetch failed:", err?.message);
    return { posts: [], configured: true, error: err?.message ?? "Unknown error" };
  }
}
