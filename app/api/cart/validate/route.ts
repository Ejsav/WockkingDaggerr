import { NextResponse } from "next/server";
import { cartSchema, resolveCart } from "@/lib/commerce";
import { publicError } from "@/lib/log";

// ============================================================
// POST /api/cart/validate
//
// The cart page calls this on mount so a tab left open overnight
// shows real prices and real stock before the shopper commits.
// Same resolver the checkout route uses, so the two can never
// disagree about what is purchasable.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(publicError("Invalid request body"), { status: 400 });
  }

  const parsed = cartSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(publicError("Invalid cart"), { status: 400 });
  }

  const resolved = await resolveCart(parsed.data);

  return NextResponse.json(
    {
      lines: resolved.lines.map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        slug: l.slug,
        name: l.name,
        size: l.size,
        quantity: l.quantity,
        unit_price_cents: l.unit_price_cents,
        image_url: l.image_url,
        available: l.available,
      })),
      removed: resolved.removed,
      adjusted: resolved.adjusted,
      subtotal_cents: resolved.subtotalCents,
      currency: resolved.currency,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
