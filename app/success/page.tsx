import Link from "next/link";
import type { Metadata } from "next";
import { getStripe } from "@/lib/stripe";
import { serviceClient } from "@/lib/supabase";
import { formatPrice, formatSize } from "@/lib/utils";
import { logWarn } from "@/lib/log";
import ClearCartOnSuccess from "@/components/shop/ClearCartOnSuccess";
import type { Order, OrderLineItem } from "@/types";

// ============================================================
// /success
//
// The confirmation is derived from Stripe, server side:
//   1. retrieve the session by id
//   2. require payment_status === "paid"
//   3. read the order the webhook persisted
//
// A hand-typed ?session_id, a replayed URL, or a link shared to
// a friend produces the unconfirmed state, not a receipt. There
// is no demo path.
// ============================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

interface Verified {
  status: "paid";
  email: string | null;
  totalCents: number;
  currency: string;
  lineItems: OrderLineItem[];
  orderRef: string | null;
  pending: boolean;
}

type Result = Verified | { status: "unpaid" } | { status: "unknown" };

async function verify(sessionId: string | undefined): Promise<Result> {
  if (!sessionId || !sessionId.startsWith("cs_")) return { status: "unknown" };

  const stripe = getStripe();
  if (!stripe) return { status: "unknown" };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    // An id that is not ours, or a Stripe outage. Either way we cannot
    // claim a payment happened.
    logWarn("success.retrieve_failed", { message: (err as Error).message });
    return { status: "unknown" };
  }

  if (session.payment_status !== "paid") return { status: "unpaid" };

  // The webhook is the system of record. It usually lands before the
  // shopper is redirected back, but not always.
  let order: Order | null = null;
  const db = serviceClient();
  if (db) {
    const { data } = await db
      .from("orders")
      .select("id,line_items,total_cents,currency,email")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    order = (data as Order | null) ?? null;
  }

  return {
    status: "paid",
    email: order?.email ?? session.customer_details?.email ?? null,
    totalCents: order?.total_cents ?? session.amount_total ?? 0,
    currency: (order?.currency ?? session.currency ?? "usd").toUpperCase(),
    lineItems: order?.line_items ?? [],
    orderRef: order ? order.id.slice(0, 8).toUpperCase() : null,
    pending: order === null,
  };
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const result = await verify(session_id);

  if (result.status !== "paid") {
    return (
      <section className="mx-auto grid min-h-[70svh] max-w-2xl place-items-center px-gutter py-section text-center">
        <div>
          <p className="eyebrow mb-5">Order status</p>
          <h1 className="display text-[clamp(2.5rem,7vw,4.5rem)]">
            {result.status === "unpaid" ? "Payment not completed." : "Nothing to show here."}
          </h1>
          <p className="prose-body mx-auto mt-6">
            {result.status === "unpaid"
              ? "This checkout session has not been paid. If you were charged, contact us and we will sort it out."
              : "We could not match this link to a completed order. If you have just paid, your confirmation email is the receipt."}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/cart" className="btn btn-primary">
              <span>Back to cart</span>
            </Link>
            <Link href="/shop" className="btn btn-secondary">
              <span>Store</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Only a verified payment empties the cart. */}
      <ClearCartOnSuccess totalCents={result.totalCents} />

      <section className="mx-auto max-w-3xl px-gutter py-section">
        <p className="eyebrow-accent mb-5">Order confirmed</p>
        <h1 className="display text-[clamp(2.75rem,8vw,5.5rem)]">
          Paid.
          <br />
          <span className="text-blade-text">Locked in.</span>
        </h1>

        <p className="prose-body mt-7 text-lg">
          {result.email
            ? `A receipt is on its way to ${result.email}. `
            : "A receipt is on its way. "}
          Orders ship within 48 hours and you will get a tracking number when yours leaves.
        </p>

        {result.lineItems.length > 0 && (
          <div className="mt-10 border border-faint bg-surface-1">
            <h2 className="eyebrow border-b border-faint px-6 py-4">What you bought</h2>
            <ul className="divide-y divide-[var(--line-faint)]">
              {result.lineItems.map((line, i) => (
                <li key={`${line.variant_id}-${i}`} className="flex items-baseline gap-4 px-6 py-4">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-card uppercase tracking-display">
                      {line.name}
                    </span>
                    <span className="meta">
                      {formatSize(line.size)} · Qty {line.quantity}
                    </span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatPrice(line.unit_price_cents * line.quantity, result.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-faint px-6 py-4">
              <span className="eyebrow">Total paid</span>
              <span className="font-display text-card tabular-nums">
                {formatPrice(result.totalCents, result.currency)}
              </span>
            </div>
          </div>
        )}

        {result.pending && (
          <p role="status" className="mt-6 border border-faint p-4 meta">
            Your payment is confirmed. The order details are still being written — refresh in a
            moment if the list above is empty.
          </p>
        )}

        {result.orderRef && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-button text-tertiary">
            Order reference {result.orderRef}
          </p>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">
            <span>Keep shopping</span>
          </Link>
          <Link href="/watch" className="btn btn-secondary">
            <span>Into the archive</span>
          </Link>
        </div>
      </section>
    </>
  );
}
