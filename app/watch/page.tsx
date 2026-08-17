"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LiveBanner from "@/components/LiveBanner";
import YouTubePlayer from "@/components/media/YouTubePlayer";
import { cn, formatCompactNumber, formatRelativeDate, formatDuration } from "@/lib/utils";
import type { MediaItem } from "@/lib/media";

type SourceFilter = "all" | "youtube" | "twitch" | "tiktok";

export default function WatchPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [search, setSearch] = useState("");

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/media", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.items)) setItems(json.items);
      return json;
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia().then((json) => {
      // Auto-sync YouTube if not populated
      if (!json?.sources?.youtube) {
        setSyncing("youtube");
        fetch("/api/sync/youtube", { method: "POST" })
          .then(() => fetchMedia())
          .catch(() => {})
          .finally(() => setSyncing(null));
      }
      // Auto-sync Twitch VODs if not populated
      if (!json?.sources?.twitch) {
        fetch("/api/sync/twitch", { method: "POST" })
          .then(() => fetchMedia())
          .catch(() => {});
      }
    });
  }, [fetchMedia]);

  const counts = useMemo(() => ({
    all: items.length,
    youtube: items.filter((i) => i.source === "youtube").length,
    twitch: items.filter((i) => i.source === "twitch").length,
    tiktok: items.filter((i) => i.source === "tiktok").length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter !== "all") list = list.filter((i) => i.source === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q));
    }
    // TikTok items have no publishedAt — keep them grouped at end when sorting newest
    if (sort === "popular") {
      list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    } else {
      list.sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [items, filter, sort, search]);

  // FEATURED STAGE — newest YouTube upload plays inline at the top.
  // Only shown in the default view (no filter, no search) so it never
  // fights the user's own browsing.
  const featured = useMemo(() => {
    if (filter !== "all" || search.trim() || sort !== "newest") return null;
    return (
      items
        .filter((i) => i.source === "youtube" && i.externalId)
        .sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return tb - ta;
        })[0] ?? null
    );
  }, [items, filter, search, sort]);

  const gridItems = useMemo(
    () => (featured ? filtered.filter((i) => i.id !== featured.id) : filtered),
    [filtered, featured]
  );

  const upNext = useMemo(() => gridItems.slice(0, 3), [gridItems]);

  const TABS: { key: SourceFilter; label: string }[] = [
    { key: "all",     label: "ALL" },
    { key: "youtube", label: "YOUTUBE" },
    { key: "twitch",  label: "TWITCH VODS" },
    { key: "tiktok",  label: "TIKTOK" },
  ];

  return (
    <>
      <LiveBanner />

      {/* Page header */}
      <section className="border-b border-white/10 pt-32 md:pt-44">
        <div className="mx-auto max-w-[1600px] px-5 pb-12 md:px-10 md:pb-16">
          <p className="eyebrow-blade mb-4">━━ THE ARCHIVE</p>
          <h1 className="display text-[clamp(3rem,11vw,9rem)] leading-[0.85] text-bone">
            WATCH<br /><span className="text-blade">EVERYTHING.</span>
          </h1>
          <p className="mt-6 max-w-xl text-bone/55 md:text-lg">
            YouTube videos, Twitch VODs, and TikTok content. Playable on-site. Auto-synced.
          </p>
          {syncing && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-blade animate-pulse">
              ● SYNCING {syncing.toUpperCase()}...
            </p>
          )}
        </div>
      </section>

      {/* Filter / search bar */}
      <section className="sticky top-[68px] z-30 border-b border-white/10 bg-ink/90 backdrop-blur-md md:top-[76px]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-10">
          {/* Source tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all",
                  filter === key
                    ? "border-blade bg-blade text-bone"
                    : "border-white/15 text-bone/65 hover:border-bone hover:text-bone"
                )}
              >
                {key === "tiktok" && <TikTokIcon className="h-3 w-3" />}
                {key === "youtube" && <YouTubeIcon className="h-3 w-3" />}
                {key === "twitch" && <TwitchIcon className="h-3 w-3" />}
                {label}
                <span className="opacity-50">[{counts[key]}]</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              type="search"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 border-b border-white/20 bg-transparent py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone placeholder-bone/30 focus:border-blade focus:outline-none md:w-52"
            />
            {/* Sort */}
            <div className="flex gap-3">
              {(["newest", "popular"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-widest transition-colors",
                    sort === s ? "text-blade" : "text-bone/45 hover:text-bone"
                  )}
                >
                  {s === "newest" ? "NEWEST" : "POPULAR"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED STAGE — newest upload plays right here */}
      {featured && !loading && (
        <section className="border-b border-white/10 bg-ink-800/40">
          <div className="mx-auto grid max-w-[1600px] gap-6 px-5 py-10 md:grid-cols-12 md:gap-8 md:px-10 md:py-16">
            <div className="md:col-span-8">
              <p className="eyebrow-blade mb-4">━━ FRESH OFF THE BLADE</p>
              <div className="relative aspect-video overflow-hidden border border-white/10 bg-ink-800">
                <YouTubePlayer
                  videoId={featured.externalId!}
                  title={featured.title}
                  className="absolute inset-0"
                />
              </div>
              <h2 className="mt-5 font-display text-2xl uppercase leading-tight tracking-tight text-bone md:text-4xl">
                {featured.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-bone/45">
                {featured.publishedAt && <span>{formatRelativeDate(featured.publishedAt)}</span>}
                {featured.viewCount != null && (
                  <span>{formatCompactNumber(featured.viewCount)} views</span>
                )}
                <Link
                  href={`/watch/youtube/${featured.externalId}`}
                  className="link-blade text-blade"
                >
                  THEATER MODE →
                </Link>
              </div>
            </div>

            {/* Up next rail */}
            <aside className="md:col-span-4">
              <p className="eyebrow mb-4">UP NEXT</p>
              <div className="flex flex-col gap-3">
                {upNext.map((item) => (
                  <UpNextCard key={item.id} item={item} />
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-video animate-pulse border border-white/5 bg-ink-700"
              >
                {i === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-bone/30">
                    PULLING THE ARCHIVE...
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : gridItems.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-bone/35">
              {search
                ? `NOTHING IN THE VAULT FOR "${search.toUpperCase()}" — TRY ANOTHER CUT`
                : "THE VAULT'S FILLING UP. SYNCING NOW."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {gridItems.map((item, i) => (
              <MediaCard key={item.id} item={item} priority={i < 3} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------
// UP NEXT CARD — compact horizontal card for the featured rail
// ------------------------------------------------------------
function UpNextCard({ item }: { item: MediaItem }) {
  const href =
    item.source === "youtube"
      ? `/watch/youtube/${item.externalId}`
      : item.source === "tiktok"
      ? `/watch/tiktok/${item.externalId}`
      : `/watch/twitch/${item.externalId}`;

  return (
    <Link href={href} className="group block">
      <article className="card-lift flex gap-3 border border-white/5 bg-ink-700 p-2.5 hover:border-blade/40">
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden bg-ink-800 md:w-36">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-blade/20" fill="currentColor" aria-hidden>
                <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
              </svg>
            </div>
          )}
          {item.duration != null && item.duration > 0 && (
            <span className="absolute bottom-1 right-1 bg-ink/80 px-1 py-0.5 font-mono text-[8px] text-bone">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <h3 className="line-clamp-2 font-display text-sm uppercase leading-tight tracking-tight text-bone transition-colors group-hover:text-blade">
            {item.title}
          </h3>
          <p className="font-mono text-[9px] uppercase tracking-widest text-bone/40">
            {item.platformLabel}
            {item.publishedAt ? ` · ${formatRelativeDate(item.publishedAt)}` : ""}
          </p>
        </div>
      </article>
    </Link>
  );
}

// ------------------------------------------------------------
// MEDIA CARD — handles YouTube, Twitch, and TikTok variants
// ------------------------------------------------------------
function MediaCard({ item, priority }: { item: MediaItem; priority?: boolean }) {
  const isTikTok = item.source === "tiktok";

  const href = item.source === "youtube"
    ? `/watch/youtube/${item.externalId}`
    : item.source === "tiktok"
    ? `/watch/tiktok/${item.externalId}`
    : `/watch/twitch/${item.externalId}`;

  // TikTok card — distinct design since no thumbnail
  if (isTikTok) {
    return (
      <Link href={href} className="group block">
        <article className="card-lift relative overflow-hidden border border-white/5 bg-ink-700 hover:border-blade/40">
          {/* TikTok visual placeholder */}
          <div
            className="relative flex items-center justify-center bg-ink-800"
            style={{ aspectRatio: "9/16", maxHeight: "360px" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.08),transparent_70%)]" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blade/20 bg-ink/60">
                <TikTokIcon className="h-7 w-7 text-bone/50 transition-colors group-hover:text-blade" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-bone/30 group-hover:text-bone/50 transition-colors">
                Watch on TikTok
              </span>
            </div>

            {/* Source badge */}
            <span className="absolute left-3 top-3 bg-ink px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-bone border border-white/20">
              TikTok
            </span>
          </div>

          {/* Meta */}
          <div className="p-4">
            <h3 className="line-clamp-2 font-display text-base uppercase leading-tight tracking-tight text-bone md:text-lg">
              {item.title}
            </h3>
            <div className="mt-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-bone/40">
              <span className="flex items-center gap-1.5">
                <TikTokIcon className="h-2.5 w-2.5" />
                @wockkingdaggerr
              </span>
              <span className="text-blade/60">→ Open</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // YouTube / Twitch card
  return (
    <Link href={href} className="group block">
      <article className="card-lift relative overflow-hidden border border-white/5 bg-ink-700 hover:border-blade/40">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-ink-800">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-700">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-blade/15" fill="currentColor">
                <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-bone/30 bg-ink/50 transition-all duration-300 group-hover:scale-110 group-hover:border-blade group-hover:bg-blade">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 text-bone">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
          </div>

          {/* Source badge */}
          <span className={cn(
            "absolute left-3 top-3 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest",
            item.source === "youtube"
              ? "bg-blade text-bone"
              : "border border-white/30 bg-ink/70 text-bone backdrop-blur-sm"
          )}>
            {item.platformLabel}
          </span>

          {/* Duration */}
          {item.duration != null && item.duration > 0 && (
            <span className="absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 font-mono text-[8px] text-bone">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="p-4">
          <h3 className="line-clamp-2 font-display text-base uppercase leading-tight tracking-tight text-bone md:text-lg">
            {item.title}
          </h3>
          <div className="mt-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-bone/40">
            <span>{item.publishedAt ? formatRelativeDate(item.publishedAt) : ""}</span>
            <span>{item.viewCount != null ? `${formatCompactNumber(item.viewCount)} views` : ""}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── INLINE ICONS ─────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}
