import { NextRequest, NextResponse } from "next/server";
import { getCachedPosts, getCacheSize } from "@/lib/post-cache";
import { SUPABASE_CONFIGURED, getPublicSupabase } from "@/lib/supabase";
import type { Post } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform"); // optional filter

  let posts: Post[] = [];

  // If Supabase is configured, read from there
  if (SUPABASE_CONFIGURED) {
    const supabase = getPublicSupabase();
    if (supabase) {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("visible", true)
        .order("posted_at", { ascending: false })
        .limit(100);

      if (platform) query = query.eq("platform", platform);

      const { data, error } = await query;
      if (!error && data) {
        posts = data as Post[];
      }
    }
  } else {
    // Use in-memory cache (populated by sync routes)
    posts = getCachedPosts();
    if (platform) posts = posts.filter((p) => p.platform === platform);
  }

  return NextResponse.json({
    posts,
    count: posts.length,
    cache_size: getCacheSize(),
    source: SUPABASE_CONFIGURED ? "supabase" : "memory",
  });
}
