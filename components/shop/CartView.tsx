"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { formatPrice, formatSize } from "@/lib/utils";
import { track } from "@/lib/analytics";

// ============================================================
// CART
//
// Every price and every stock figure on this page comes from
// /api/cart/validate, not from localStorage. A tab left open
// overnight re-validates on mount and tells the shopper exactly
// what changed before they can spend money.
// ============================================================

interface ResolvedLine {
  product_id: string;
  variant_id: string;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
  image_url: string | null;
  available: number;
}

interface ValidationResponse {
  lines: ResolvedLine[];
  removed: Array<{ variant_id: string }>;
  adjusted: Array<{ variant_id: string; requested: number; granted: number }>;
  subtotal_cents: number;
  currency: string;
}

export default function CartView() {
  const { lines, ready, setQuantity, remove, clear } = useCart();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  const [resolved, setResolved] = useState<ValidationResponse | null>(null);
  const [validating, setValidating] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async () => {
    if (lines.length === 0) {
      setResolved(null);
      setValidating(false);
      return;
    }
    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) throw new Error("validate failed");
      const data = (await res.json()) as ValidationResponse;
      setResolved(data);

      // Reconcile the stored cart with reality, and say what changed.
      const messages: string[] = [];
      for (const r of data.removed) {
        remove(r.variant_id);
        messages.push("An item sold out and was removed.");
      }
      for (const a of data.adjusted) {
        setQuantity(a.variant_id, a.granted);
        messages.push(`Only ${a.granted} left of one item — quantity reduced.`);
      }
      setNotice(messages.length > 0 ? Array.from(new Set(messages)).join(" ") : null);
    } catch {
      setError("Could not refresh your cart. Reload to try again.");
    } finally {
      setValidating(false);
    }
    // `lines` is intentionally the only trigger: re-validating on every
    // helper identity change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    if (!ready) return;
    // Kicked off as a promise so nothing sets state synchronously inside
    // the effect body; `validating` starts true, so there is no flash.
    void Promise.resolve().then(validate);
  }, [ready, validate]);

  const trackedView = useRef(false);
  useEffect(() => {
    if (!ready || trackedView.current || lines.length === 0) return;
    trackedView.current = true;
    track("view_cart", { lines: lines.length });
  }, [ready, lines.length]);

  async function onCheckout() {
    if (checkingOut) return;
    setCheckingOut(true);
    setError(null);
    track("begin_checkout", {
      lines: lines.length,
      value_cents: resolved?.subtotal_cents ?? 0,
    });

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        setError(json.error ?? "Checkout is unavailable right now.");
        setCheckingOut(false);
        track("checkout_rejected", { status: res.status });
        // The cart changed underneath us — show the shopper the new truth.
        if (res.status === 409) void validate();
        return;
      }

      track("checkout_redirected", { value_cents: resolved?.subtotal_cents ?? 0 });
      window.location.href = json.url;
    } catch {
      setError("Network problem. Nothing has been charged.");
      setCheckingOut(false);
      track("checkout_rejected", { status: 0 });
    }
  }

  if (!ready) {
    return <p className="meta mt-10">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-faint bg-surface-1 px-gutter py-16 text-center">
        <p className="display text-section">Nothing in the cart.</p>
        <p className="prose-body mx-auto mt-4">
          {cancelled
            ? "Checkout was cancelled and nothing was charged."
            : "Pick something from the store and it will show up here."}
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          <span>Go to the store</span>
        </Link>
      </div>
    );
  }

  const display = resolved?.lines ?? [];
  const subtotal = resolved?.subtotal_cents ?? 0;
  const currency = resolved?.currency ?? "USD";

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        {cancelled && (
          <p role="status" className="mb-6 border border-faint bg-surface-1 p-4 meta">
            Checkout was cancelled. Nothing was charged and your cart is intact.
          </p>
        )}
        {notice && (
          <p role="status" className="mb-6 border border-[var(--blade)]/50 bg-blade/10 p-4 font-mono text-[11px] uppercase tracking-button text-blade-text">
            {notice}
          </p>
        )}

        <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
          {display.map((line) => (
            <li key={line.variant_id} className="flex gap-4 py-5">
              <Link
                href={`/shop/${line.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden border border-faint bg-surface-1"
              >
                {line.image_url && (
                  <Image src={line.image_url} alt="" fill sizes="80px" className="object-cover" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/shop/${line.slug}`} className="link-draw font-display text-card uppercase tracking-display text-primary">
                  {line.name}
                </Link>
                <p className="meta mt-1">
                  {formatSize(line.size)} · {formatPrice(line.unit_price_cents, currency)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center border border-[var(--line-strong)]">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variant_id, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${line.name}, size ${formatSize(line.size)}`}
                      className="grid h-11 w-11 place-items-center font-mono text-[var(--text-secondary)] transition-colors duration-fast hover:text-primary"
                    >
                      −
                    </button>
                    <span className="grid h-11 w-10 place-items-center font-mono text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={line.quantity >= line.available}
                      onClick={() => setQuantity(line.variant_id, line.quantity + 1)}
                      aria-label={`Increase quantity of ${line.name}, size ${formatSize(line.size)}`}
                      className="grid h-11 w-11 place-items-center font-mono text-[var(--text-secondary)] transition-colors duration-fast hover:text-primary disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      remove(line.variant_id);
                      track("remove_from_cart", { variant_id: line.variant_id });
                    }}
                    className="link-draw font-mono text-[11px] uppercase tracking-button"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-mono text-sm tabular-nums">
                {formatPrice(line.unit_price_cents * line.quantity, currency)}
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={clear}
          className="link-draw mt-5 font-mono text-[11px] uppercase tracking-button"
        >
          Empty cart
        </button>
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="border border-faint bg-surface-1 p-6">
          <h2 className="eyebrow mb-5">Summary</h2>

          <dl className="space-y-3 border-b border-faint pb-5">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-secondary)]">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatPrice(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-secondary)]">Shipping</dt>
              <dd className="meta">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="flex justify-between gap-4 py-5">
            <p className="eyebrow">Total</p>
            <p className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-none tabular-nums">
              {formatPrice(subtotal, currency)}
            </p>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={checkingOut || validating || display.length === 0}
            className="btn btn-primary w-full"
          >
            <span>{checkingOut ? "Opening checkout…" : "Checkout"}</span>
          </button>

          <p role="status" aria-live="polite" className="mt-4 min-h-5">
            {error ? (
              <span className="font-mono text-[11px] uppercase tracking-button text-blade-text">
                {error}
              </span>
            ) : (
              <span className="meta">Secure payment by Stripe. Card details never touch this site.</span>
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
