import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/admin/drop
// Create, edit, publish and delete drops. This is what makes the
// drop calendar real: there is no seeded drop anywhere in the
// codebase, so everything on /drops was entered here.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const dropFields = z.object({
  slug: z.string().trim().min(2).max(60).regex(slugPattern, "Use lowercase words separated by hyphens."),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  hero_image_url: z.string().trim().max(500).optional().or(z.literal("")),
  drops_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  product_ids: z.array(z.string().max(64)).max(40).default([]),
  published: z.boolean().default(false),
});

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create") }).merge(dropFields),
  z.object({ action: z.literal("update"), id: z.string().uuid() }).merge(dropFields),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(publicError("Invalid request body"), { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      publicError(parsed.error.issues[0]?.message ?? "Check the drop details."),
      { status: 400 }
    );
  }

  const db = serviceClient();
  if (!db) return NextResponse.json(publicError("Storage unavailable."), { status: 503 });

  const input = parsed.data;

  if (input.action === "delete") {
    const { error } = await db.from("drops").delete().eq("id", input.id);
    if (error) {
      const ref = logError("admin.drop.delete", error, { drop: input.id });
      return NextResponse.json(publicError("Could not delete.", ref), { status: 500 });
    }
    invalidate(TAGS.drops);
    logInfo("admin.drop.deleted", { drop: input.id });
    return NextResponse.json({ ok: true });
  }

  if (input.ends_at && new Date(input.ends_at) <= new Date(input.drops_at)) {
    return NextResponse.json(
      publicError("The close time must be after the open time."),
      { status: 400 }
    );
  }

  const row = {
    slug: input.slug,
    name: input.name,
    description: input.description,
    hero_image_url: input.hero_image_url || null,
    drops_at: input.drops_at,
    ends_at: input.ends_at || null,
    product_ids: input.product_ids,
    published: input.published,
  };

  const query =
    input.action === "create"
      ? db.from("drops").insert(row).select("id,slug,published").single()
      : db.from("drops").update(row).eq("id", input.id).select("id,slug,published").single();

  const { data, error } = await query;

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(publicError("A drop with that slug already exists."), { status: 409 });
    }
    const ref = logError(`admin.drop.${input.action}`, error, { slug: input.slug });
    return NextResponse.json(publicError("Could not save the drop.", ref), { status: 500 });
  }

  invalidate(TAGS.drops);
  logInfo(`admin.drop.${input.action}`, { drop: data.id, published: data.published });
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug, published: data.published });
}
