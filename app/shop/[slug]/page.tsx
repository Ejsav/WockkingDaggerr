import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MOCK_PRODUCTS, getProductBySlug, getAllDrops, computeDropStatus } from "@/lib/mock-data";
import { formatPrice, formatDate } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import BuyButton from "./BuyButton";

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Not found" };
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://wockkingdagger.com";
  const desc = product.tagline ?? product.description.slice(0, 155);
  return {
    title: product.name,
    description: desc,
    openGraph: {
      title: `${product.name} — WockkingDagger`,
      description: desc,
      url: `${BASE}/shop/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — WockkingDagger`,
      description: desc,
    },
  };
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const related = MOCK_PRODUCTS.filter(
    (p) => p.active && p.id !== product.id && p.category === product.category
  ).slice(0, 4);

  // Check if this product is part of an active drop
  const drops = getAllDrops().map((d) => ({ ...d, status: computeDropStatus(d) }));
  const activeDrop = drops.find(
    (d) => d.status !== "ended" && d.product_ids.includes(product.id)
  );

  const isVeryLow = product.inventory_count !== null && product.inventory_count < 10;
  const isLow = product.inventory_count !== null && product.inventory_count < 20;
  const isApparel = ["apparel"].includes(product.category.toLowerCase());

  return (
    <>
      <section className="pt-24 md:pt-36">
        <div className="mx-auto max-w-[1500px] px-5 md:px-10">

          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/35 md:mb-10">
            <Link href="/shop" className="hover:text-bone transition-colors">Shop</Link>
            <span className="text-bone/20">/</span>
            <span className="text-bone/55">{product.category}</span>
          </nav>

          <div className="grid gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">

            {/* ── IMAGE COLUMN ── */}
            <div className="md:col-span-7 lg:col-span-6">
              <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.06] bg-ink-700 md:aspect-[4/5]">
                {product.image_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-800">
                    <svg viewBox="0 0 24 24" className="h-20 w-20 text-blade/15" fill="currentColor">
                      <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
                    </svg>
                  </div>
                )}

                {/* Drop badge */}
                {activeDrop && (
                  <div className="absolute left-4 top-4">
                    <span
                      className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest ${
                        activeDrop.status === "live"
                          ? "bg-blade text-bone"
                          : "border border-gold text-gold"
                      }`}
                    >
                      {activeDrop.status === "live" ? "● LIVE DROP" : "UPCOMING DROP"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── DETAIL COLUMN ── */}
            <div className="md:col-span-5 lg:col-span-6 md:pt-4 lg:pt-8">
              {/* Category + drop context */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <p className="eyebrow">{product.category.toUpperCase()}</p>
                {activeDrop && (
                  <Link
                    href="/drops"
                    className="font-mono text-[9px] uppercase tracking-widest text-blade hover:opacity-70 transition-opacity"
                  >
                    {activeDrop.name} →
                  </Link>
                )}
              </div>

              {/* Product name */}
              <h1 className="display text-[clamp(2rem,5vw,4rem)] leading-[0.92] text-bone">
                {product.name}
              </h1>

              {/* Tagline */}
              {product.tagline && (
                <p className="mt-4 text-base text-bone/55 md:text-lg">{product.tagline}</p>
              )}

              {/* Price + stock row */}
              <div className="my-8 flex items-center justify-between border-y border-white/[0.08] py-6 md:my-10">
                <div>
                  <p className="eyebrow mb-1">Price</p>
                  <p className="font-display text-4xl tracking-wider text-bone md:text-5xl">
                    {formatPrice(product.price_cents, product.currency)}
                  </p>
                </div>

                <div className="text-right">
                  {isVeryLow && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-blade">
                      {product.inventory_count} left
                    </p>
                  )}
                  {isLow && !isVeryLow && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                      Low stock
                    </p>
                  )}
                  {!isLow && product.inventory_count !== null && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
                      {product.inventory_count} in stock
                    </p>
                  )}
                  {isApparel && (
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-bone/30">
                      Unisex sizing
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-bone/65 md:text-base">{product.description}</p>

              {/* Buy button + size selector */}
              <BuyButton product={product} />

              {/* Trust cues */}
              <div className="mt-8 space-y-2.5 border-t border-white/[0.08] pt-8">
                {[
                  ["Ships within 48 hours", "USPS Priority / DHL"],
                  ["Tracked worldwide", "USA · EU · UK · CA · AU"],
                  ["Real products, real stock", "Updated daily"],
                ].map(([label, sub]) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 text-blade">●</span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-bone/70">{label}</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-bone/35">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Drop context */}
              {activeDrop && (
                <div className="mt-6 border border-blade/25 bg-blade/5 p-4">
                  <p className="eyebrow-blade mb-1">Part of {activeDrop.name}</p>
                  <p className="text-sm text-bone/60">{activeDrop.description}</p>
                  <Link
                    href="/drops"
                    className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-blade hover:opacity-70 transition-opacity"
                  >
                    See full drop →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-white/[0.08] md:mt-28">
          <div className="mx-auto max-w-[1500px] px-5 py-14 md:px-10 md:py-20">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="display text-3xl md:text-4xl">
                More <span className="text-blade">{product.category}</span>
              </h2>
              <Link href="/shop" className="font-mono text-[10px] uppercase tracking-widest text-bone/50 hover:text-blade transition-colors">
                All products →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
