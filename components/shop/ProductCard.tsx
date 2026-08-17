import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { isSoldOut, totalInventory, type Product } from "@/types";

// ============================================================
// PRODUCT CARD
//
// Availability comes from real variant stock. "Sold out" and
// "low stock" are derived, never authored, and the number shown
// is the number that is actually purchasable.
// ============================================================

const LOW_STOCK_THRESHOLD = 8;

export default function ProductCard({
  product,
  priority = false,
  group = "shop",
}: {
  product: Product;
  priority?: boolean;
  group?: string;
}) {
  const soldOut = isSoldOut(product);
  const remaining = totalInventory(product);
  const low = !soldOut && remaining <= LOW_STOCK_THRESHOLD;

  return (
    <article data-reveal="" data-reveal-group={group}>
      <Link href={`/shop/${product.slug}`} className="group block focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden border border-faint bg-surface-1 transition-colors duration-base ease-out group-hover:border-[var(--line-strong)] group-focus-visible:border-[var(--blade-text)]">
          {product.image_urls[0] ? (
            <Image
              src={product.image_urls[0]}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className={`object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03] ${soldOut ? "opacity-45" : ""}`}
            />
          ) : (
            <div className="grid h-full place-items-center bg-surface-2" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[var(--line-strong)]" fill="currentColor">
                <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
              </svg>
            </div>
          )}

          {soldOut && (
            <span className="absolute left-3 top-3 bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-button text-primary">
              Sold out
            </span>
          )}
          {low && (
            <span className="absolute left-3 top-3 bg-blade px-2 py-1 font-mono text-[10px] uppercase tracking-button text-bone">
              {remaining} left
            </span>
          )}
        </div>

        <h3 className="mt-3 font-display text-card uppercase tracking-display">{product.name}</h3>
      </Link>

      <p className="mt-1 flex items-baseline justify-between gap-3">
        <span className="font-mono text-sm tabular-nums text-[var(--text-secondary)]">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-button text-tertiary">
          {product.category}
        </span>
      </p>
    </article>
  );
}
