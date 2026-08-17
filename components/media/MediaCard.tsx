import Link from "next/link";
import Image from "next/image";
import { formatCompactNumber, formatDuration, formatRelativeDate } from "@/lib/utils";
import type { MediaItem } from "@/types";
import SocialIcon from "@/components/site/SocialIcon";

// ============================================================
// ARCHIVE CARD
//
// One card handles every source. The aspect ratio is fixed per
// source and the image is a next/image fill, so the grid never
// shifts while thumbnails load — the reserved box exists before
// the bytes arrive.
// ============================================================

export function mediaHref(item: MediaItem): string {
  return `/watch/${item.source}/${item.external_id}`;
}

const RATIO: Record<MediaItem["source"], string> = {
  youtube: "aspect-video",
  twitch: "aspect-video",
  tiktok: "aspect-[9/16]",
  instagram: "aspect-square",
};

export default function MediaCard({
  item,
  priority = false,
  group = "archive",
}: {
  item: MediaItem;
  priority?: boolean;
  group?: string;
}) {
  const duration = formatDuration(item.duration_seconds);
  const published = item.published_at ? formatRelativeDate(item.published_at) : null;
  const views = formatCompactNumber(item.view_count);

  return (
    <article data-reveal="" data-reveal-group={group}>
      <Link href={mediaHref(item)} className="group block focus-visible:outline-none">
        <div
          className={`relative overflow-hidden border border-faint bg-surface-1 transition-colors duration-base ease-out group-hover:border-[var(--line-strong)] group-focus-visible:border-[var(--blade-text)] ${RATIO[item.source]}`}
        >
          {item.thumbnail_url ? (
            <Image
              src={item.thumbnail_url}
              alt=""
              fill
              // Three columns at desktop, two at tablet, one on a phone.
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-cover transition-transform duration-slow ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-surface-2">
              <SocialIcon platform={item.source} className="h-8 w-8 text-tertiary" />
            </div>
          )}

          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
          />

          <span className="absolute left-3 top-3 flex items-center gap-1.5 border border-[var(--line-strong)] bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-button backdrop-blur-sm">
            <SocialIcon platform={item.source} className="h-2.5 w-2.5" />
            {item.source}
          </span>

          {duration && (
            <span className="absolute bottom-3 right-3 bg-ink/85 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-primary">
              {duration}
            </span>
          )}

          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--blade-text)] bg-ink/60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 text-bone">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-card uppercase tracking-display">
          {item.title}
        </h3>
      </Link>

      {(published || views) && (
        <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-button text-tertiary">
          {published && <span>{published}</span>}
          {published && views && <span aria-hidden>·</span>}
          {views && <span>{views} views</span>}
        </p>
      )}
    </article>
  );
}
