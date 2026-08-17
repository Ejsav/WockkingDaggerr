import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, getProductCategories } from "@/lib/data/catalog";
import ProductCard from "@/components/shop/ProductCard";
import EmptyState from "@/components/site/EmptyState";
import JsonLd from "@/components/site/JsonLd";
import { Reveal, MaskLine } from "@/components/motion/Reveal";
import { breadcrumbSchema, collectionSchema } from "@/lib/schema";
import { isSoldOut } from "@/types";

// Category filtering is a URL, not client state — same reasoning as
// the archive: crawlable, shareable, back-button correct.
export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const categories = await getProductCategories();
  const active = category && categories.includes(category) ? category : null;

  return {
    title: active ? `${active} — Store` : "Store",
    description: active
      ? `${active} from WockkingDagger. Small runs, real stock, shipped in 48 hours.`
      : "Apparel, prints and accessories from WockkingDagger. Made in small runs.",
    alternates: { canonical: active ? `/shop?category=${active}` : "/shop" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getProductCategories()]);

  const active = category && categories.includes(category) ? category : null;
  const filtered = active ? products.filter((p) => p.category === active) : products;

  // Sold-out pieces sink rather than disappear — the run is part of the record.
  const ordered = [...filtered].sort(
    (a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b))
  );

  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-shell px-gutter pb-12 pt-14 md:pb-16 md:pt-24">
          <Reveal>
            <p className="eyebrow-accent mb-5">The store</p>
          </Reveal>
          <h1 className="display-hero">
            <MaskLine>Armory.</MaskLine>
          </h1>
          <Reveal delay={200}>
            <p className="prose-body mt-7 text-lg">
              Apparel, prints and accessories. Made in small runs, shipped within 48 hours. When a
              run sells through, it is gone.
            </p>
          </Reveal>
        </div>
      </section>

      {categories.length > 1 && (
        <nav
          aria-label="Filter products by category"
          className="sticky top-nav z-30 border-b border-[var(--line)] bg-ink/92 backdrop-blur-md"
        >
          <div className="no-scrollbar mx-auto flex max-w-shell gap-2 overflow-x-auto px-gutter py-3">
            {[null, ...categories].map((c) => {
              const selected = active === c;
              return (
                <Link
                  key={c ?? "all"}
                  href={c ? `/shop?category=${c}` : "/shop"}
                  aria-current={selected ? "page" : undefined}
                  scroll={false}
                  className={`flex min-h-11 shrink-0 items-center px-4 font-mono text-[11px] uppercase tracking-button transition-colors duration-base ease-out border ${
                    selected
                      ? "border-[var(--blade)] bg-blade text-bone"
                      : "border-[var(--line-strong)] text-[var(--text-secondary)] hover:border-bone hover:text-primary"
                  }`}
                >
                  {c ?? "All"}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <section className="mx-auto max-w-shell px-gutter py-section">
        {ordered.length > 0 ? (
          <>
            <p className="meta mb-8">
              {ordered.length} {ordered.length === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {ordered.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          </>
        ) : products.length === 0 ? (
          <EmptyState
            title="The store is closed."
            body="Nothing is published right now. Get on the list and you will know the moment the next run goes live."
            action={{ label: "See drops", href: "/drops" }}
          />
        ) : (
          <EmptyState
            title="Nothing in this category."
            body="There are no products filed under this category right now."
            action={{ label: "See everything", href: "/shop" }}
          />
        )}
      </section>

      <JsonLd
        data={[
          collectionSchema(
            "Store",
            "Apparel, prints and accessories from WockkingDagger.",
            active ? `/shop?category=${active}` : "/shop"
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Store", path: "/shop" },
          ]),
        ]}
      />
    </>
  );
}
