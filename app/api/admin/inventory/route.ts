import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/admin/inventory
// Sets the physical unit count for one variant. This is the
// control that turns the seeded catalog into a real, buyable
// store. Gated by middleware.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  variant_id: z.string().min(1).max(64),
  inventory_count: z.number().int().min(0).max(1_000_000),
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
    return NextResponse.json(publicError("Enter a whole number of units."), { status: 400 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json(publicError("Storage unavailable."), { status: 503 });
  }

  // Reject a count below what is already held by open checkouts — that
  // would violate the not-oversold constraint and strand a paying customer.
  const { data: current, error: readError } = await db
    .from("product_variants")
    .select("reserved_count")
    .eq("id", parsed.data.variant_id)
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json(publicError("Variant not found."), { status: 404 });
  }

  if (parsed.data.inventory_count < current.reserved_count) {
    return NextResponse.json(
      publicError(
        `${current.reserved_count} unit(s) are held by open checkouts. Set at least that many.`
      ),
      { status: 409 }
    );
  }

  const { data, error } = await db
    .from("product_variants")
    .update({ inventory_count: parsed.data.inventory_count, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.variant_id)
    .select("id,inventory_count,reserved_count")
    .single();

  if (error) {
    const ref = logError("admin.inventory", error, { variant: parsed.data.variant_id });
    return NextResponse.json(publicError("Could not save.", ref), { status: 500 });
  }

  invalidate(TAGS.products);
  logInfo("admin.inventory.updated", {
    variant: data.id,
    inventory_count: data.inventory_count,
  });

  return NextResponse.json({
    ok: true,
    variant_id: data.id,
    inventory_count: data.inventory_count,
    available: data.inventory_count - data.reserved_count,
  });
}
