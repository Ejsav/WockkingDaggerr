import Link from "next/link";
import type { Metadata } from "next";
import { getMediaItems, getMediaCounts, getLiveStatus } from "@/lib/data/media";
import { WD } from "@/lib/wockkingdagger";
import MediaCard from "@/components/media/MediaCard";
import LiveBanner from "@/components/site/LiveBanner";
import EmptyState from "@/components/site/EmptyState";
import JsonLd from "@/components/site/JsonLd";
import { Reveal, MaskLine } from "@/components/motion/Reveal";
import { breadcrumbSchema, collectionSchema } from "@/lib/schema";
import type { MediaSource } from "@/types";

// ============================================================
// /watch — the archive index
//
// Server rendered so every card is in the HTML a crawler sees.
// Filtering is a set of links, not client state: each filter is
// its own crawlable, shareable, back-button-correct URL.
// ============================================================

export const revalidate = 300;

const SOURCES: Array<{ key: "all" | MediaSource; label: string }> = [
  { key: "all", label: "All" },
  { key: "youtube", label: "YouTube" },
  { key: "twitch", label: "Twitch" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
];

function isSource(value: string | undefined): value is MediaSource {
  return value === "youtube" || value === "twitch" || value === "tiktok" || value === "instagram";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}): Promise<Metadata> {
  const { source } = await searchParams;
  const filtered = isSource(source);
  const label = filtered ? SOURCES.find((s) => s.key === source)?.label : null;

  return {
    title: filtered ? `${label} archive` : WD.copy.archiveTitle,
    description: filtered
      ? `Every ${label} upload from ${WD.displayName}, in one place.`
      : WD.copy.archiveDescription,
    // A filtered view canonicalises to itself so each source page can
    // rank; it is a distinct set of content, not a duplicate.
    alternates: { canonical: filtered ? `/watch?source=${source}` : "/watch" },
    openGraph: {
      title: filtered ? `${label} archive — ${WD.displayName}` : WD.copy.archiveTitle,
      description: WD.copy.archiveDescription,
      url: filtered ? `/watch?source=${source}` : "/watch",
    },
  };
}

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const active: "all" | MediaSource = isSource(source) ? source : "all";

  const [all, counts, live] = await Promise.all([
    getMediaItems(),
    getMediaCounts(),
    getLiveStatus(),
  ]);

  const items = active === "all" ? all : all.filter((i) => i.source === active);

  return (
    <>
      <LiveBanner status={live} />

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-shell px-gutter pb-12 pt-14 md:pb-16 md:pt-24">
          <Reveal>
            <p className="eyebrow-accent mb-5">{WD.copy.archiveTitle}</p>
          </Reveal>
          <h1 className="display-hero">
            <MaskLine>Watch</MaskLine>
            <MaskLine delay={120}>
              <span className="text-blade-text">everything.</span>
            </MaskLine>
          </h1>
          <Reveal delay={260}>
            <p className="prose-body mt-7 text-lg">{WD.copy.archiveDescription}</p>
          </Reveal>
        </div>
      </section>

      {/* Filters are links. They work without JavaScript, they are
          crawlable, and the back button behaves. */}
      <nav
        aria-label="Filter the archive by platform"
        className="sticky top-nav z-30 border-b border-[var(--line)] bg-ink/92 backdrop-blur-md"
      >
        <div className="no-scrollbar mx-auto flex max-w-shell gap-2 overflow-x-auto px-gutter py-3">
          {SOURCES.map(({ key, label }) => {
            const count = counts[key];
            const selected = active === key;
            if (key !== "all" && count === 0) return null;
            return (
              <Link
                key={key}
                href={key === "all" ? "/watch" : `/watch?source=${key}`}
                aria-current={selected ? "page" : undefined}
                scroll={false}
                className={`flex min-h-11 shrink-0 items-center gap-2 border px-4 font-mono text-[11px] uppercase tracking-button transition-colors duration-base ease-out ${
                  selected
                    ? "border-[var(--blade)] bg-blade text-bone"
                    : "border-[var(--line-strong)] text-[var(--text-secondary)] hover:border-bone hover:text-primary"
                }`}
              >
                {label}
                <span className={selected ? "text-bone/70" : "text-tertiary"}>{count}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="mx-auto max-w-shell px-gutter py-section">
        {items.length > 0 ? (
          <>
            <p className="meta mb-8">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
            <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <MediaCard key={item.id} item={item} priority={i < 3} />
              ))}
            </div>
          </>
        ) : all.length === 0 ? (
          <EmptyState
            title="Nothing synced yet."
            body="The archive fills itself from YouTube, Twitch, TikTok and Instagram on a schedule. Until the first sync runs, the channels are the place to look."
            action={{ label: "Watch on YouTube", href: WD.youtube.urlMain, external: true }}
          />
        ) : (
          <EmptyState
            title="Nothing here yet."
            body="There is no content from this platform in the archive."
            action={{ label: "See everything", href: "/watch" }}
          />
        )}
      </section>

      <JsonLd
        data={[
          collectionSchema(
            WD.copy.archiveTitle,
            WD.copy.archiveDescription,
            active === "all" ? "/watch" : `/watch?source=${active}`
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Archive", path: "/watch" },
          ]),
        ]}
      />
    </>
  );
}
