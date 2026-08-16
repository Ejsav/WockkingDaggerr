import { NextResponse } from "next/server";
import { fetchInstagramMedia } from "@/lib/providers/instagram";
import { getServiceSupabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await fetchInstagramMedia();

  if (!result.configured) {
    return NextResponse.json(
      { ok: false, configured: false, message: result.error },
      { status: 200 }
    );
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({
      ok: true,
      configured: true,
      synced: result.posts.length,
      persisted: false,
      preview: result.posts.slice(0, 3),
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
    synced: result.posts.length,
    persisted: true,
  });
}
