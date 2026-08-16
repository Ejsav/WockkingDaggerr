import { NextResponse } from "next/server";
import { fetchYouTubeUploads } from "@/lib/providers/youtube";
import { getServiceSupabase, SUPABASE_CONFIGURED } from "@/lib/supabase";
import { setCachedPosts, markSynced, getCacheSize } from "@/lib/post-cache";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await fetchYouTubeUploads();

  if (!result.configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: result.error,
        hint: "Set YOUTUBE_API_KEY and YOUTUBE_UPLOADS_PLAYLIST_ID in .env.local",
      },
      { status: 200 }
    );
  }

  if (result.error && result.posts.length === 0) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  // Always write to the in-memory cache so videos are available instantly
  // even without Supabase configured
  setCachedPosts(result.posts);
  markSynced("youtube");

  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({
      ok: true,
      configured: true,
      channels_synced: result.channels_synced,
      synced: result.posts.length,
      persisted: false,
      cached: true,
      cache_size: getCacheSize(),
      message: "Videos loaded into memory. Add Supabase credentials to persist across restarts.",
      errors: result.error ?? null,
      preview: result.posts.slice(0, 8).map((p) => ({
        title: p.title,
        posted_at: p.posted_at,
        thumbnail: p.thumbnail_url,
        url: p.permalink,
        tags: p.tags,
        video_id: p.external_id,
      })),
    });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service not configured" }, { status: 500 });
  }

  const { error } = await supabase.from("posts").upsert(result.posts, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    channels_synced: result.channels_synced,
    synced: result.posts.length,
    persisted: true,
    cached: true,
    errors: result.error ?? null,
  });
}
