import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getMediaItems } from "@/lib/data/media";
import { getLiveStatus } from "@/lib/data/media";
import { getProducts, getDropsView, getDropProducts } from "@/lib/data/catalog";
import { WD } from "@/lib/wockkingdagger";
import { SITE_URL } from "@/lib/env";
import MediaCard from "@/components/media/MediaCard";
import ProductCard from "@/components/shop/ProductCard";
import LiveBanner from "@/components/site/LiveBanner";
import Countdown from "@/components/site/Countdown";
import EmptyState from "@/components/site/EmptyState";
import JsonLd from "@/components/site/JsonLd";
import { Reveal, MaskLine } from "@/components/motion/Reveal";
import { dropEventSchema } from "@/lib/schema";
import { formatCompactNumber } from "@/lib/utils";

// Static shell, refreshed on a schedule and invalidated on write.
// A cold start renders this from the durable store with no provider
// call anywhere in the path.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [media, live, products, drops] = await Promise.all([
    getMediaItems(),
    getLiveStatus(),
    getProducts(),
    getDropsView(),
  ]);

  const featured = media[0] ?? null;
  const recent = media.slice(1, 7);
  const shopStrip = products.slice(0, 4);
  const nextDrop = drops.upcoming ?? drops.live[0] ?? null;
  const dropProducts = nextDrop ? await getDropProducts(nextDrop) : [];

  // Only real, summable figures. Nothing is displayed that we cannot count.
  const totalViews = media.reduce((sum, m) => sum + (m.view_count ?? 0), 0);

  return (
    <>
      <LiveBanner status={live} />

      {/* ── HERO — full bleed, asymmetric, masked line reveal ───── */}
      <section className="bleed relative isolate overflow-hidden border-b border-[var(--line)]">
        {featured?.thumbnail_url && (
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute inset-0 scale-110" data-parallax="0.08">
              <Image
                src={featured.thumbnail_url}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-25"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
          </div>
        )}

        <div className="mx-auto grid max-w-shell gap-10 px-gutter pb-14 pt-16 md:grid-cols-12 md:gap-8 md:pb-24 md:pt-28">
          <div className="md:col-span-8">
            <Reveal>
              <p className="eyebrow-accent mb-6">{WD.tagline}</p>
            </Reveal>
            <h1 className="display-hero">
              <MaskLine delay={80}>Wockking</MaskLine>
              <MaskLine delay={200}>
                <span className="text-blade-text">Dagger</span>
              </MaskLine>
            </h1>
            <Reveal delay={420}>
              <p className="prose-body mt-8 text-lg">{WD.bio}</p>
            </Reveal>
            <Reveal delay={520} className="mt-10 flex flex-wrap gap-3">
              <Link href="/watch" className="btn btn-primary">
                <span>Enter the archive</span>
              </Link>
              <Link href="/shop" className="btn btn-secondary">
                <span>Shop</span>
              </Link>
            </Reveal>
          </div>

          {/* Counted facts only — the archive size and its view total. */}
          {media.length > 0 && (
            <Reveal
              delay={620}
              className="flex gap-8 self-end md:col-span-4 md:flex-col md:gap-6 md:border-l md:border-[var(--line)] md:pl-8"
            >
              <div>
                <p className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums">
                  <span data-count-to={media.length}>{media.length}</span>
                </p>
                <p className="eyebrow mt-2">Items on record</p>
              </div>
              {totalViews > 0 && (
                <div>
                  <p className="font-display text-[clamp(2rem,4vw,3rem)] leading-none">
                    {formatCompactNumber(totalViews)}
                  </p>
                  <p className="eyebrow mt-2">Lifetime views</p>
                </div>
              )}
            </Reveal>
          )}
        </div>
      </section>

      {/* ── DROP — the slow moment. Contained, dark, one accent. ── */}
      {nextDrop ? (
        <section className="bleed relative overflow-hidden border-b border-[var(--line)] bg-surface-1">
          <JsonLd data={dropEventSchema(nextDrop)} />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,rgba(200,16,46,0.16),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-shell gap-12 px-gutter py-section md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <Reveal>
                <p className="eyebrow-accent mb-5">
                  {drops.upcoming ? "Next drop" : "Live drop"}
                </p>
              </Reveal>
              <h2 className="display">
                <MaskLine>{nextDrop.name}</MaskLine>
              </h2>
              {nextDrop.description && (
                <Reveal delay={160}>
                  <p className="prose-body mt-7 max-w-xl">{nextDrop.description}</p>
                </Reveal>
              )}
              <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
                <Link href="/drops" className="btn btn-primary">
                  <span>See the drop</span>
                </Link>
              </Reveal>
            </div>

            <Reveal delay={120} className="md:col-span-5">
              <p className="eyebrow mb-4">
                {drops.upcoming ? "Doors open in" : "Closes in"}
              </p>
              <Countdown
                targetIso={drops.upcoming ? nextDrop.drops_at : (nextDrop.ends_at ?? nextDrop.drops_at)}
              />
            </Reveal>

            {dropProducts.length > 0 && (
              <div className="md:col-span-12">
                <hr className="rule mb-10" />
                <p className="eyebrow mb-6">In this drop</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {dropProducts.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} group="drop" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── ARCHIVE — the acquisition surface, given the most room ─ */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-shell px-gutter py-section">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <p className="eyebrow-accent mb-4">The archive</p>
              </Reveal>
              <h2 className="display">
                <MaskLine>Everything</MaskLine>
                <MaskLine delay={120}>on record.</MaskLine>
              </h2>
            </div>
            <Reveal delay={200}>
              <Link
                href="/watch"
                className="link-draw font-mono text-meta uppercase tracking-button"
              >
                All {media.length > 0 ? media.length : ""} items →
              </Link>
            </Reveal>
          </div>

          {recent.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((item, i) => (
                <MediaCard key={item.id} item={item} priority={i < 3} group="home-archive" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The archive is syncing."
              body="Nothing has been pulled in yet. Everything published on YouTube, Twitch, TikTok and Instagram lands here automatically once the first sync runs."
              action={{ label: "Watch on YouTube", href: WD.youtube.urlMain, external: true }}
            />
          )}
        </div>
      </section>

      {/* ── STORE ────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)] bg-surface-1">
        <div className="mx-auto max-w-shell px-gutter py-section">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <p className="eyebrow-accent mb-4">The store</p>
              </Reveal>
              <h2 className="display">
                <MaskLine>Standard</MaskLine>
                <MaskLine delay={120}>issue.</MaskLine>
              </h2>
            </div>
            <Reveal delay={200}>
              <Link href="/shop" className="link-draw font-mono text-meta uppercase tracking-button">
                All products →
              </Link>
            </Reveal>
          </div>

          {shopStrip.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {shopStrip.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 2} group="home-shop" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The store is closed."
              body="No products are published right now. Join the list and you will hear the moment the next run goes up."
              action={{ label: "See drops", href: "/drops" }}
            />
          )}
        </div>
      </section>

      {/* ── MANIFESTO — full bleed, oversized, no card, no grid ─── */}
      <section className="bleed border-b border-[var(--line)]">
        <div className="mx-auto max-w-shell px-gutter py-section">
          <Reveal>
            <p className="eyebrow-accent mb-8">Manifesto</p>
          </Reveal>
          <p className="display-hero">
            <MaskLine>No filler.</MaskLine>
            <MaskLine delay={120}>No filter.</MaskLine>
            <MaskLine delay={240}>
              <span className="text-blade-text">Just work.</span>
            </MaskLine>
          </p>
          <Reveal delay={420}>
            <p className="prose-body mt-12 max-w-2xl text-lg">
              This is the record. Every upload, every VOD, every drop, documented in one place.
              If it is not here, it is not part of the work.
            </p>
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${WD.copy.siteTitle} — Official Hub`,
          url: SITE_URL,
          description: WD.copy.siteDescription,
        }}
      />
    </>
  );
}
