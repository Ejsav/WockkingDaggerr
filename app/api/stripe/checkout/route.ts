import { NextResponse } from "next/server";
import { getStripe, SHIPPING_COUNTRIES } from "@/lib/stripe";
import { cartSchema, resolveCart, toOrderLineItems } from "@/lib/commerce";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { SITE_URL } from "@/lib/env";
import { logError, logInfo, publicError } from "@/lib/log";

// ============================================================
// POST /api/stripe/checkout
//
// Order of operations matters:
//   1. resolve the cart against the database (price, size, stock)
//   2. hold the stock under our own checkout_ref
//   3. create the Stripe session
//   4. if step 3 fails, release the hold
//
// Holding before calling Stripe is what stops two shoppers from
// both reaching the payment page for the same last unit.
//
// There is no demo mode. Without Stripe configured this returns
// 503 and the storefront says checkout is unavailable.
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

  const stripe = getStripe();
  const db = serviceClient();

  if (!stripe || !db) {
    return NextResponse.json(
      publicError("Checkout is temporarily unavailable."),
      { status: 503 }
    );
  }

  // ---- 1. server-side resolution: the client's prices are ignored
  const resolved = await resolveCart(parsed.data);

  if (resolved.lines.length === 0) {
    return NextResponse.json(
      { error: "Everything in your cart just sold out.", removed: resolved.removed },
      { status: 409 }
    );
  }

  // A stale tab that asked for more than exists gets sent back to review
  // the corrected cart rather than being charged for a different order.
  if (resolved.adjusted.length > 0 || resolved.removed.length > 0) {
    return NextResponse.json(
      {
        error: "Your cart changed while you were shopping.",
        adjusted: resolved.adjusted,
        removed: resolved.removed,
      },
      { status: 409 }
    );
  }

  // ---- 2. hold the stock
  const checkoutRef = crypto.randomUUID();
  const { error: reserveError } = await db.rpc("reserve_inventory", {
    p_checkout_ref: checkoutRef,
    p_items: resolved.lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
  });

  if (reserveError) {
    // INSUFFICIENT_STOCK is an expected outcome, not a system failure.
    if (reserveError.message?.includes("INSUFFICIENT_STOCK")) {
      invalidate(TAGS.products);
      return NextResponse.json(
        { error: "Someone got there first — one of your items just sold out." },
        { status: 409 }
      );
    }
    const ref = logError("checkout.reserve", reserveError, { checkoutRef });
    return NextResponse.json(publicError("Could not hold your items.", ref), { status: 500 });
  }

  // ---- 3. create the session
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: checkoutRef,
        line_items: resolved.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: line.currency.toLowerCase(),
            unit_amount: line.unit_price_cents,
            product_data: {
              name: line.name,
              // The size reaches Stripe, the receipt, and the packing slip.
              description: line.size === "ONE_SIZE" ? undefined : `Size ${line.size}`,
              images: line.image_url?.startsWith("http")
                ? [line.image_url]
                : line.image_url
                  ? [`${SITE_URL}${line.image_url}`]
                  : undefined,
              metadata: { variant_id: line.variant_id, size: line.size },
            },
          },
        })),
        success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/cart?cancelled=1`,
        allow_promotion_codes: true,
        shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
        phone_number_collection: { enabled: false },
        // Comfortably inside the 35-minute reservation TTL.
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        metadata: {
          checkout_ref: checkoutRef,
          line_items: JSON.stringify(toOrderLineItems(resolved.lines)).slice(0, 480),
        },
      },
      // Stripe-side idempotency: a double-clicked button reuses the session.
      { idempotencyKey: checkoutRef }
    );

    if (!session.url) throw new Error("Stripe returned a session without a URL");

    logInfo("checkout.created", {
      checkoutRef,
      session_id: session.id,
      lines: resolved.lines.length,
      total_cents: resolved.subtotalCents,
    });

    invalidate(TAGS.products);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // ---- 4. never leave stock stranded behind a session that does not exist
    await db.rpc("release_reservation", { p_checkout_ref: checkoutRef });
    const ref = logError("checkout.stripe", err, { checkoutRef });
    return NextResponse.json(
      publicError("Could not start checkout. Nothing has been charged.", ref),
      { status: 502 }
    );
  }
}
