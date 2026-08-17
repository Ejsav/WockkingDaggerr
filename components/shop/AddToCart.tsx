"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { formatPrice, formatSize } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { isSoldOut, type Product } from "@/types";

// ============================================================
// SIZE + QUANTITY + ADD TO CART
//
// The size a shopper picks is a variant id, and that id is what
// travels: cart → /api/stripe/checkout → reservation → webhook →
// order row. There is no separate "size" string that can be
// dropped along the way.
//
// Quantity is capped at what is actually available for the
// chosen variant, so the cart cannot be built into a state that
// checkout will reject.
// ============================================================

export default function AddToCart({ product }: { product: Product }) {
  const { add, lines } = useCart();
  const soldOut = isSoldOut(product);

  const sellable = useMemo(
    () => product.variants.filter((v) => v.inventory_count > 0),
    [product.variants]
  );
  const singleVariant = product.variants.length === 1;

  const [variantId, setVariantId] = useState<string | null>(
    singleVariant ? (product.variants[0]?.id ?? null) : null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const inCart = lines.find((l) => l.variant_id === variantId)?.quantity ?? 0;
  const maxAddable = variant ? Math.max(0, Math.min(10, variant.inventory_count - inCart)) : 0;

  function choose(id: string) {
    setVariantId(id);
    setQuantity(1);
    setError(null);
    setAdded(false);
  }

  function onAdd() {
    if (!variant) {
      setError("Choose a size first.");
      return;
    }
    if (maxAddable < 1) {
      setError("You already have every available unit in your cart.");
      return;
    }
    const qty = Math.min(quantity, maxAddable);
    add({ product_id: product.id, variant_id: variant.id, quantity: qty });
    setAdded(true);
    setError(null);
    track("add_to_cart", {
      product_id: product.id,
      variant_id: variant.id,
      size: variant.size,
      quantity: qty,
      value_cents: product.price_cents * qty,
    });
  }

  if (soldOut) {
    return (
      <div className="mt-8 border-t border-faint pt-8">
        <p className="font-display text-section uppercase">Sold out</p>
        <p className="prose-body mt-3 text-sm">
          Every size in this run is gone. Get on the list and you will hear first when it returns.
        </p>
        <Link href="/#main" className="btn btn-secondary mt-6">
          <span>Notify me of the next run</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-7 border-t border-faint pt-8">
      {!singleVariant && (
        <fieldset>
          <legend className="eyebrow mb-3">Size</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.inventory_count <= 0;
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  aria-pressed={selected}
                  onClick={() => choose(v.id)}
                  className={`relative grid h-12 min-w-12 place-items-center border px-3 font-mono text-xs uppercase tracking-button transition-colors duration-base ease-out ${
                    selected
                      ? "border-[var(--blade)] bg-blade text-bone"
                      : out
                        ? "cursor-not-allowed border-faint text-tertiary"
                        : "border-[var(--line-strong)] text-[var(--text-secondary)] hover:border-bone hover:text-primary"
                  }`}
                >
                  {formatSize(v.size)}
                  {out && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-x-1 top-1/2 h-px -rotate-[20deg] bg-[var(--line-strong)]"
                      />
                      <span className="sr-only"> — sold out</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {sellable.length < product.variants.length && (
            <p className="meta mt-3">
              {sellable.length} of {product.variants.length} sizes still in stock
            </p>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="eyebrow mb-3" id="qty-label">
            Quantity
          </p>
          <div className="flex items-center border border-[var(--line-strong)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-12 w-12 place-items-center font-mono text-lg text-[var(--text-secondary)] transition-colors duration-fast hover:bg-white/5 hover:text-primary disabled:opacity-35"
            >
              −
            </button>
            <output
              aria-labelledby="qty-label"
              className="grid h-12 w-12 place-items-center font-mono text-sm tabular-nums"
            >
              {quantity}
            </output>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(Math.max(1, maxAddable), q + 1))}
              disabled={!variant || quantity >= maxAddable}
              aria-label="Increase quantity"
              className="grid h-12 w-12 place-items-center font-mono text-lg text-[var(--text-secondary)] transition-colors duration-fast hover:bg-white/5 hover:text-primary disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">Total</p>
          <p className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-none tabular-nums">
            {formatPrice(product.price_cents * quantity, product.currency)}
          </p>
        </div>
      </div>

      {variant && variant.inventory_count <= 8 && (
        <p className="font-mono text-[11px] uppercase tracking-button text-blade-text">
          Only {variant.inventory_count} left in {formatSize(variant.size)}
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={!variant || maxAddable < 1}
        className="btn btn-primary w-full"
      >
        <span>{!variant ? "Select a size" : "Add to cart"}</span>
      </button>

      <p role="status" aria-live="polite" className="min-h-5">
        {error ? (
          <span className="font-mono text-[11px] uppercase tracking-button text-blade-text">
            {error}
          </span>
        ) : added ? (
          <span className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-button text-tertiary">
            Added to cart
            <Link href="/cart" className="link-draw text-primary">
              View cart →
            </Link>
          </span>
        ) : null}
      </p>
    </div>
  );
}
