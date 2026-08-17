import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProducts, getDropsView } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils";
import { computeDropStatus, isSoldOut, totalInventory } from "@/types";
import AddToCart from "@/components/shop/AddToCart";
import ProductCard from "@/components/shop/ProductCard";
import ViewTracker from "@/components/shop/ViewTracker";
import JsonLd from "@/components/site/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { breadcrumbSchema, productSchema } from "@/lib/schema";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found", robots: { index: false, follow: true } };

  const description = product.tagline ?? product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — WockkingDagger`,
      description,
      url: `/shop/${product.slug}`,
      images: product.image_urls[0] ? [{ url: product.image_urls[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [all, drops] = await Promise.all([getProducts(), getDropsView()]);

  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const activeDrop = [drops.upcoming, ...drops.live]
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .find((d) => d.product_ids.includes(product.id));

  const soldOut = isSoldOut(product);
  const remaining = totalInventory(product);

  return (
    <>
      <ViewTracker
        productId={product.id}
        slug={product.slug}
        priceCents={product.price_cents}
      />

      <article className="mx-auto max-w-shell px-gutter pb-section pt-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-button text-tertiary">
            <li>
              <Link href="/shop" className="link-draw">
                Store
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/shop?category=${product.category}`} className="link-draw">
                {product.category}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
          <div className="md:col-span-7 lg:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden border border-faint bg-surface-1">
              {product.image_urls[0] ? (
                <Image
                  src={product.image_urls[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 768px) 55vw, 100vw"
                  className={`object-cover ${soldOut ? "opacity-55" : ""}`}
                />
              ) : (
                <div className="grid h-full place-items-center" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-20 w-20 text-[var(--line-strong)]" fill="currentColor">
                    <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
                  </svg>
                </div>
              )}
              {activeDrop && (
                <span className="absolute left-4 top-4 border border-[var(--gold)] bg-ink/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-button text-[var(--gold)] backdrop-blur-sm">
                  {computeDropStatus(activeDrop) === "live" ? "Live drop" : "Upcoming drop"}
                </span>
              )}
            </div>

            {product.image_urls.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.image_urls.slice(1, 5).map((url) => (
                  <div key={url} className="relative aspect-square border border-faint bg-surface-1">
                    <Image src={url} alt="" fill sizes="20vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-5 lg:col-span-6">
            <Reveal>
              <p className="eyebrow">{product.category}</p>
            </Reveal>
            <h1 className="display mt-3 text-[clamp(2rem,4.5vw,3.5rem)]">{product.name}</h1>
            {product.tagline && (
              <p className="mt-4 text-lg text-[var(--text-secondary)]">{product.tagline}</p>
            )}

            <div className="mt-8 flex items-end justify-between gap-4 border-y border-faint py-6">
              <div>
                <p className="eyebrow mb-1.5">Price</p>
                <p className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums">
                  {formatPrice(product.price_cents, product.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="eyebrow mb-1.5">Availability</p>
                <p
                  className={`font-mono text-xs uppercase tracking-button ${
                    soldOut ? "text-tertiary" : remaining <= 8 ? "text-blade-text" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {soldOut ? "Sold out" : `${remaining} available`}
                </p>
              </div>
            </div>

            <p className="mt-7 whitespace-pre-line text-[var(--text-secondary)]">
              {product.description}
            </p>

            <AddToCart product={product} />

            <ul className="mt-8 space-y-3 border-t border-faint pt-8">
              {[
                ["Ships within 48 hours", "Tracked, worldwide"],
                ["Real stock", "Counts update as orders are paid"],
                ["30-day returns", "Unworn, tags on"],
              ].map(([label, detail]) => (
                <li key={label} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-blade" />
                  <span>
                    <span className="block font-mono text-[11px] uppercase tracking-button text-[var(--text-secondary)]">
                      {label}
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-button text-tertiary">
                      {detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {activeDrop && (
              <div className="mt-6 border border-[var(--blade)]/40 bg-blade/5 p-5">
                <p className="eyebrow-accent mb-2">Part of {activeDrop.name}</p>
                {activeDrop.description && (
                  <p className="text-sm text-[var(--text-secondary)]">{activeDrop.description}</p>
                )}
                <Link href="/drops" className="link-draw mt-3 inline-block font-mono text-[11px] uppercase tracking-button">
                  See the full drop →
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-shell px-gutter py-section">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="display text-section">
                More {product.category}
              </h2>
              <Link href="/shop" className="link-draw font-mono text-meta uppercase tracking-button">
                All products →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} group="related-products" />
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Store", path: "/shop" },
            { name: product.name, path: `/shop/${product.slug}` },
          ]),
        ]}
      />
    </>
  );
}
