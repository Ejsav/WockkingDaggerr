import Image from "next/image";
import type { Metadata } from "next";
import { getDropsView, getDropProducts } from "@/lib/data/catalog";
import { formatDate } from "@/lib/utils";
import Countdown from "@/components/site/Countdown";
import ProductCard from "@/components/shop/ProductCard";
import EmptyState from "@/components/site/EmptyState";
import SignupForm from "@/components/site/SignupForm";
import JsonLd from "@/components/site/JsonLd";
import { Reveal, MaskLine } from "@/components/motion/Reveal";
import { breadcrumbSchema, dropEventSchema } from "@/lib/schema";

// Every drop on this page was entered in the control room. There is no
// seeded drop anywhere in the codebase, so an empty calendar is the
// honest state rather than a placeholder countdown.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Scheduled releases from WockkingDagger. When the timer hits zero the door opens; when stock runs out it closes.",
  alternates: { canonical: "/drops" },
};

export default async function DropsPage() {
  const drops = await getDropsView();
  const [upcomingProducts, liveProducts] = await Promise.all([
    drops.upcoming ? getDropProducts(drops.upcoming) : Promise.resolve([]),
    drops.live[0] ? getDropProducts(drops.live[0]) : Promise.resolve([]),
  ]);

  const nothingScheduled =
    !drops.upcoming && drops.live.length === 0 && drops.ended.length === 0;

  return (
    <>
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-shell px-gutter pb-12 pt-14 md:pb-16 md:pt-24">
          <Reveal>
            <p className="eyebrow-accent mb-5">Drop calendar</p>
          </Reveal>
          <h1 className="display-hero">
            <MaskLine>Drops.</MaskLine>
            <MaskLine delay={120}>
              <span className="text-blade-text">Every one.</span>
            </MaskLine>
          </h1>
          <Reveal delay={260}>
            <p className="prose-body mt-7 text-lg">
              Scheduled releases. When the timer hits zero, the door opens. When stock runs out,
              the door closes. Nothing comes back.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── UPCOMING — the slow reveal, given the most space ────── */}
      {drops.upcoming && (
        <section className="bleed relative overflow-hidden border-b border-[var(--line)] bg-surface-1">
          <JsonLd data={dropEventSchema(drops.upcoming)} />
          {drops.upcoming.hero_image_url && (
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute inset-0 scale-110" data-parallax="0.06">
                <Image
                  src={drops.upcoming.hero_image_url}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover opacity-20"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-ink/60 to-ink" />
            </div>
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(65%_55%_at_75%_0%,rgba(200,16,46,0.18),transparent_70%)]"
          />

          <div className="relative mx-auto grid max-w-shell gap-12 px-gutter py-section md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <Reveal>
                <p className="eyebrow-accent mb-5">Upcoming</p>
              </Reveal>
              <h2 className="display">
                <MaskLine>{drops.upcoming.name}</MaskLine>
              </h2>
              {drops.upcoming.description && (
                <Reveal delay={160}>
                  <p className="prose-body mt-7 max-w-xl">{drops.upcoming.description}</p>
                </Reveal>
              )}
              <Reveal delay={240}>
                <p className="meta mt-7">
                  Opens {formatDate(drops.upcoming.drops_at)}
                  {drops.upcoming.ends_at && ` · closes ${formatDate(drops.upcoming.ends_at)}`}
                </p>
              </Reveal>
            </div>

            <Reveal delay={120} className="md:col-span-5">
              <p className="eyebrow mb-4">Doors open in</p>
              <Countdown targetIso={drops.upcoming.drops_at} />
            </Reveal>

            {upcomingProducts.length > 0 && (
              <div className="md:col-span-12">
                <hr className="rule mb-10" />
                <p className="eyebrow mb-6">Pieces in this drop</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
                  {upcomingProducts.map((p) => (
                    <ProductCard key={p.id} product={p} group="upcoming-drop" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── LIVE ─────────────────────────────────────────────────── */}
      {drops.live.map((drop, index) => (
        <section key={drop.id} className="border-b border-[var(--line)]">
          <JsonLd data={dropEventSchema(drop)} />
          <div className="mx-auto max-w-shell px-gutter py-section">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow-accent mb-4 flex items-center gap-2">
                  <span className="pulse-live inline-block h-2 w-2 rounded-full bg-blade" aria-hidden />
                  Live now
                </p>
                <h2 className="display text-section">{drop.name}</h2>
                {drop.description && <p className="prose-body mt-4">{drop.description}</p>}
              </div>
              {drop.ends_at && (
                <div className="w-full max-w-sm">
                  <p className="eyebrow mb-3">Closes in</p>
                  <Countdown targetIso={drop.ends_at} onCompleteLabel="Closed" />
                </div>
              )}
            </div>

            {index === 0 && liveProducts.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
                {liveProducts.map((p) => (
                  <ProductCard key={p.id} product={p} group="live-drop" />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ── ARCHIVE ──────────────────────────────────────────────── */}
      {drops.ended.length > 0 && (
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-shell px-gutter py-section">
            <Reveal>
              <p className="eyebrow mb-4">Archived drops</p>
            </Reveal>
            <h2 className="display text-section">Closed vault.</h2>
            <p className="prose-body mt-4">
              Past drops, documented. The stock is gone; the record stays.
            </p>

            <ul className="mt-12 divide-y divide-[var(--line-faint)] border-y border-faint">
              {drops.ended.map((drop) => (
                <li
                  key={drop.id}
                  data-reveal=""
                  data-reveal-group="ended"
                  className="flex flex-col gap-2 py-7 md:flex-row md:items-baseline md:justify-between md:gap-8"
                >
                  <div>
                    <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] uppercase tracking-display">
                      {drop.name}
                    </h3>
                    {drop.description && (
                      <p className="prose-body mt-1 text-sm">{drop.description}</p>
                    )}
                  </div>
                  <p className="meta shrink-0">
                    {formatDate(drop.drops_at)}
                    {drop.ends_at && ` — ${formatDate(drop.ends_at)}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {nothingScheduled && (
        <section className="mx-auto max-w-shell px-gutter py-section">
          <EmptyState
            eyebrow="Nothing scheduled"
            title="No drop on the calendar."
            body="When the next release is dated it appears here with a live countdown. The list finds out before the page does."
          >
            <div className="mx-auto mt-10 max-w-md text-left">
              <SignupForm source="drops-empty" />
            </div>
          </EmptyState>
        </section>
      )}

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Drops", path: "/drops" },
        ])}
      />
    </>
  );
}
