import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/admin/media
// Hide or restore one archive item. Sync preserves this flag, so
// a hidden video stays hidden across future syncs.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  media_id: z.string().min(1).max(128),
  visible: z.boolean(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(publicError("Invalid request body"), { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(publicError("Invalid request."), { status: 400 });
  }

  const db = serviceClient();
  if (!db) return NextResponse.json(publicError("Storage unavailable."), { status: 503 });

  const { data, error } = await db
    .from("media_items")
    .update({ visible: parsed.data.visible })
    .eq("id", parsed.data.media_id)
    .select("id,visible")
    .maybeSingle();

  if (error) {
    const ref = logError("admin.media", error, { media: parsed.data.media_id });
    return NextResponse.json(publicError("Could not save.", ref), { status: 500 });
  }
  if (!data) return NextResponse.json(publicError("Item not found."), { status: 404 });

  invalidate(TAGS.media);
  logInfo("admin.media.updated", { media: data.id, visible: data.visible });
  return NextResponse.json({ ok: true, media_id: data.id, visible: data.visible });
}
