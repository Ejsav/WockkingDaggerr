import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const lowStock = product.inventory_count !== null && product.inventory_count < 20;
  const veryLow = product.inventory_count !== null && product.inventory_count < 10;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block border border-white/5 bg-ink-700 transition-colors duration-300 hover:border-blade/40"
    >
      {/* Product image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
        {product.image_urls?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-800" />
        )}

        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

        {/* Category tag */}
        <span className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-widest text-bone/60">
          {product.category}
        </span>

        {/* Stock badge */}
        {lowStock && (
          <span
            className={`absolute right-3 top-3 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
              veryLow
                ? "bg-blade text-bone"
                : "border border-bone/30 bg-ink/70 text-bone backdrop-blur-sm"
            }`}
          >
            {veryLow ? `${product.inventory_count} left` : "Low stock"}
          </span>
        )}

        {/* Quick-view hint on hover */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-blade py-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-mono text-[9px] uppercase tracking-widest text-bone">
            VIEW PRODUCT →
          </span>
        </div>
      </div>

      {/* Product info */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-display text-base uppercase tracking-tight text-bone md:text-lg">
              {product.name}
            </h3>
            {product.tagline && (
              <p className="mt-0.5 line-clamp-1 text-xs text-bone/45">{product.tagline}</p>
            )}
          </div>
          <p className="shrink-0 font-mono text-sm font-medium tracking-wider text-bone">
            {formatPrice(product.price_cents, product.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}
