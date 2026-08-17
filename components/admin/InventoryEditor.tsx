"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatSize } from "@/lib/utils";
import type { AdminProduct } from "@/lib/data/admin";

// ============================================================
// INVENTORY
//
// This is the control that turns the seeded catalog into a real
// store: each row writes an actual unit count to Postgres and
// invalidates the storefront cache. The "held" column is stock
// currently inside an open checkout — the server refuses a count
// below it, because those units are already promised.
// ============================================================

export default function InventoryEditor({ products }: { products: AdminProduct[] }) {
  if (products.length === 0) {
    return <p className="meta">No products. Run the catalog migration first.</p>;
  }

  return (
    <div className="space-y-12">
      {products.map((product) => (
        <section key={product.id}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-card uppercase tracking-display">{product.name}</h3>
            <p className="meta">
              {formatPrice(product.price_cents, product.currency)} · {product.category}
              {!product.active && " · hidden"}
            </p>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-faint">
                <th scope="col" className="py-2 pr-4 eyebrow font-normal">Size</th>
                <th scope="col" className="py-2 pr-4 eyebrow font-normal">SKU</th>
                <th scope="col" className="py-2 pr-4 eyebrow font-normal">Held</th>
                <th scope="col" className="py-2 eyebrow font-normal">On hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-faint)]">
              {product.variants.map((variant) => (
                <VariantRow key={variant.id} variant={variant} />
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function VariantRow({ variant }: { variant: AdminProduct["variants"][number] }) {
  const router = useRouter();
  const [value, setValue] = useState(String(variant.inventory_count));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const dirty = value !== String(variant.inventory_count);

  async function save() {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setState("error");
      setMessage("Whole numbers only.");
      return;
    }

    setState("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id: variant.id, inventory_count: parsed }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? "Could not save.");
        return;
      }
      setState("saved");
      setMessage("Saved");
      // Pull the server's own numbers back rather than trusting local state.
      router.refresh();
    } catch {
      setState("error");
      setMessage("Network problem.");
    }
  }

  return (
    <tr>
      <th scope="row" className="py-3 pr-4 font-mono text-xs uppercase tracking-button font-normal">
        {formatSize(variant.size)}
      </th>
      <td className="py-3 pr-4 font-mono text-[11px] text-tertiary">{variant.sku}</td>
      <td className="py-3 pr-4 font-mono text-xs tabular-nums text-tertiary">
        {variant.reserved_count}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`inv-${variant.id}`}>
            Units on hand for size {formatSize(variant.size)}
          </label>
          <input
            id={`inv-${variant.id}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setState("idle");
              setMessage(null);
            }}
            className="h-11 w-24 border border-[var(--line-strong)] bg-transparent px-3 font-mono text-sm tabular-nums focus:border-[var(--blade-text)] focus:outline-none"
          />
          <button
            type="button"
            onClick={save}
            disabled={!dirty || state === "saving"}
            className="h-11 border border-[var(--line-strong)] px-4 font-mono text-[11px] uppercase tracking-button transition-colors duration-base ease-out hover:border-bone hover:text-primary disabled:opacity-35"
          >
            {state === "saving" ? "Saving…" : "Save"}
          </button>
          <span
            role="status"
            className={`font-mono text-[10px] uppercase tracking-button ${
              state === "error" ? "text-blade-text" : "text-tertiary"
            }`}
          >
            {message}
          </span>
        </div>
      </td>
    </tr>
  );
}
