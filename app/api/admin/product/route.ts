import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/admin/product
// Publish or unpublish a product. An inactive product leaves the
// storefront and the sitemap, and RLS stops the anon key reading
// it at all.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  product_id: z.string().min(1).max(64),
  active: z.boolean(),
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
    .from("products")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.product_id)
    .select("id,active")
    .maybeSingle();

  if (error) {
    const ref = logError("admin.product", error, { product: parsed.data.product_id });
    return NextResponse.json(publicError("Could not save.", ref), { status: 500 });
  }
  if (!data) return NextResponse.json(publicError("Product not found."), { status: 404 });

  invalidate(TAGS.products);
  logInfo("admin.product.updated", { product: data.id, active: data.active });
  return NextResponse.json({ ok: true, product_id: data.id, active: data.active });
}
