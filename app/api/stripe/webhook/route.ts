import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, logWarn, publicError } from "@/lib/log";
import type { OrderLineItem } from "@/types";

// ============================================================
// POST /api/stripe/webhook
//
// The only writer of orders. Every delivery is:
//   * signature verified against STRIPE_WEBHOOK_SECRET
//   * recorded in stripe_events before it has any effect
//
// commit_purchase does both in one transaction, so a replay —
// Stripe retries for up to three days — cannot create a second
// order or decrement stock twice. Proven in scripts/db-verify.sh.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HANDLED = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "checkout.session.async_payment_failed",
]);

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = serverEnv.stripeWebhookSecret;

  if (!stripe || !secret) {
    logWarn("webhook.unconfigured");
    return NextResponse.json(publicError("Webhook not configured"), { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(publicError("Missing signature"), { status: 400 });
  }

  // The raw body is required — any parsing before this invalidates the signature.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    // An invalid signature is an attack or a misconfiguration, never a retry.
    logWarn("webhook.bad_signature", { message: (err as Error).message });
    return NextResponse.json(publicError("Invalid signature"), { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const db = serviceClient();
  if (!db) {
    // 500 makes Stripe retry once the database is reachable again.
    logError("webhook.no_database", new Error("service role unavailable"), { event: event.id });
    return NextResponse.json(publicError("Storage unavailable"), { status: 500 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const checkoutRef = session.client_reference_id ?? session.metadata?.checkout_ref ?? null;

  if (!checkoutRef) {
    logWarn("webhook.no_checkout_ref", { event: event.id, session: session.id });
    return NextResponse.json({ received: true, ignored: "no checkout_ref" });
  }

  // ---- session did not result in a payment: give the stock back
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const { error } = await db.rpc("release_reservation", { p_checkout_ref: checkoutRef });
    if (error) {
      const ref = logError("webhook.release", error, { event: event.id, checkoutRef });
      return NextResponse.json(publicError("Release failed", ref), { status: 500 });
    }
    invalidate(TAGS.products);
    logInfo("webhook.released", { event: event.id, checkoutRef });
    return NextResponse.json({ received: true, released: true });
  }

  // ---- payment must actually have succeeded
  if (session.payment_status !== "paid") {
    logInfo("webhook.not_paid", { event: event.id, status: session.payment_status });
    return NextResponse.json({ received: true, ignored: "payment_status not paid" });
  }

  const lineItems = await resolveLineItems(stripe, session, checkoutRef, db);

  const { data, error } = await db.rpc("commit_purchase", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_checkout_ref: checkoutRef,
    p_session_id: session.id,
    p_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    p_email: session.customer_details?.email ?? null,
    p_shipping_name: session.customer_details?.name ?? null,
    p_total_cents: session.amount_total ?? 0,
    p_currency: (session.currency ?? "usd").toUpperCase(),
    p_line_items: lineItems,
  });

  if (error) {
    // Returning 500 asks Stripe to retry; the event ledger makes that safe.
    const ref = logError("webhook.commit", error, { event: event.id, checkoutRef });
    return NextResponse.json(publicError("Could not record order", ref), { status: 500 });
  }

  invalidate(TAGS.products);
  logInfo("webhook.order_recorded", {
    event: event.id,
    order_id: data,
    session: session.id,
    total_cents: session.amount_total,
  });

  return NextResponse.json({ received: true, order_id: data });
}

/**
 * Rebuild the order lines from our own held reservations, joined to
 * live product data. Stripe's line items carry display text; the
 * reservations carry the variant identity we actually shipped against.
 *
 * Falls back to the compact copy stashed in session metadata if the
 * reservation rows were swept before the webhook arrived.
 */
async function resolveLineItems(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  checkoutRef: string,
  db: NonNullable<ReturnType<typeof serviceClient>>
): Promise<OrderLineItem[]> {
  const { data, error } = await db
    .from("inventory_reservations")
    .select(
      "quantity,variant_id,product_variants!inner(size,product_id," +
        "products!inner(id,slug,name,price_cents))"
    )
    .eq("checkout_ref", checkoutRef)
    .eq("state", "held");

  if (!error && data && data.length > 0) {
    return (data as unknown as Array<{
      quantity: number;
      variant_id: string;
      product_variants: {
        size: string;
        product_id: string;
        products: { id: string; slug: string; name: string; price_cents: number };
      };
    }>).map((row) => ({
      product_id: row.product_variants.products.id,
      variant_id: row.variant_id,
      slug: row.product_variants.products.slug,
      name: row.product_variants.products.name,
      size: row.product_variants.size,
      quantity: row.quantity,
      unit_price_cents: row.product_variants.products.price_cents,
    }));
  }

  const stashed = session.metadata?.line_items;
  if (stashed) {
    try {
      const parsed = JSON.parse(stashed) as OrderLineItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        logWarn("webhook.line_items_from_metadata", { checkoutRef });
        return parsed;
      }
    } catch {
      // fall through to the Stripe copy
    }
  }

  // Last resort: what Stripe charged for. Enough to service the customer
  // even if the variant identity is gone.
  try {
    const expanded = await stripe.checkout.sessions.listLineItems(session.id, { limit: 50 });
    logWarn("webhook.line_items_from_stripe", { checkoutRef });
    return expanded.data.map((li) => ({
      product_id: "",
      variant_id: "",
      slug: "",
      name: li.description ?? "Item",
      size: "UNKNOWN",
      quantity: li.quantity ?? 1,
      unit_price_cents: li.amount_total ?? 0,
    }));
  } catch {
    return [];
  }
}
