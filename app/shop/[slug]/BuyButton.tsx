"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

const APPAREL_CATEGORIES = ["apparel"];
const SIZES = ["S", "M", "L", "XL", "2XL"];

export default function BuyButton({ product }: { product: Product }) {
  const isApparel = APPAREL_CATEGORIES.includes(product.category.toLowerCase());

  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | null>(isApparel ? null : "ONE_SIZE");
  const [error, setError] = useState<string | null>(null);

  async function onBuy() {
    if (isApparel && !size) {
      setError("Select a size before checking out.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: [{ product_id: product.id, quantity: qty, size }],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      window.location.href = json.url;
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">

      {/* Size selector — apparel only */}
      {isApparel && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">SIZE</p>
            {!size && (
              <p className="font-mono text-[9px] uppercase tracking-widest text-blade">
                SELECT A SIZE
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => { setSize(s); setError(null); }}
                className={`flex h-11 w-11 items-center justify-center border font-mono text-xs uppercase tracking-wider transition-all ${
                  size === s
                    ? "border-blade bg-blade text-bone"
                    : "border-white/20 text-bone/70 hover:border-bone hover:text-bone"
                }`}
                aria-pressed={size === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-5">
        <div>
          <p className="eyebrow mb-3">QTY</p>
          <div className="flex items-center border border-white/15">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center font-mono text-lg text-bone/60 transition-colors hover:bg-white/5 hover:text-bone"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="flex h-11 w-12 items-center justify-center font-mono text-sm text-bone">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(q + 1, 10))}
              className="flex h-11 w-11 items-center justify-center font-mono text-lg text-bone/60 transition-colors hover:bg-white/5 hover:text-bone"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Price preview */}
        <div className="mt-6">
          <p className="eyebrow mb-3">TOTAL</p>
          <p className="font-display text-2xl text-bone">
            {formatPrice(product.price_cents * qty, product.currency)}
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onBuy}
        disabled={loading || (isApparel && !size)}
        className="btn-blade w-full py-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "OPENING CHECKOUT..."
          : isApparel && !size
          ? "SELECT A SIZE TO CONTINUE"
          : "CHECKOUT →"}
      </button>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-blade">{error}</p>
      )}
    </div>
  );
}
