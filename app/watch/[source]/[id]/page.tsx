import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMediaItem, getMediaItems, getRelatedMedia } from "@/lib/data/media";
import { formatCompactNumber, formatDate, formatDuration } from "@/lib/utils";
import { WD } from "@/lib/wockkingdagger";
import MediaPlayer from "@/components/media/MediaPlayer";
import MediaCard from "@/components/media/MediaCard";
import JsonLd from "@/components/site/JsonLd";
import { breadcrumbSchema, videoSchema } from "@/lib/schema";
import type { MediaSource } from "@/types";

// ============================================================
// /watch/{source}/{id} — one page per item
//
// This is the long tail. The title, description, duration and
// publish date are all in the server HTML, and VideoObject makes
// the page eligible for a video result.
// ============================================================

export const revalidate = 3600;
export const dynamicParams = true;

const SOURCES = new Set<MediaSource>(["youtube", "twitch", "tiktok", "instagram"]);

function parseSource(value: string): MediaSource | null {
  return SOURCES.has(value as MediaSource) ? (value as MediaSource) : null;
}

/**
 * Pre-render the most recent slice at build time; everything older is
 * generated on first request and then cached. A 400-video archive does
 * not need to be a 400-page build.
 */
export async function generateStaticParams() {
  const items = await getMediaItems();
  return items.slice(0, 40).map((item) => ({ source: item.source, id: item.external_id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<Metadata> {
  const { source, id } = await params;
  const parsed = parseSource(source);
  if (!parsed) return { title: "Not found" };

  const item = await getMediaItem(parsed, id);
  if (!item) return { title: "Not found", robots: { index: false, follow: true } };

  const description =
    item.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `${item.title} — ${WD.displayName} on ${item.source}.`;
  const canonical = `/watch/${item.source}/${item.external_id}`;

  return {
    title: item.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      title: item.title,
      description,
      url: canonical,
      images: item.thumbnail_url ? [{ url: item.thumbnail_url }] : undefined,
    },
    twitter: {
      card: "player",
      title: item.title,
      description,
      images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
    },
  };
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  const parsed = parseSource(source);
  if (!parsed) notFound();

  const item = await getMediaItem(parsed, id);
  if (!item) notFound();

  const related = await getRelatedMedia(item);
  const canonical = `/watch/${item.source}/${item.external_id}`;
  const video = videoSchema(item, canonical);
  const duration = formatDuration(item.duration_seconds);
  const views = formatCompactNumber(item.view_count);

  return (
    <>
      <article className="mx-auto max-w-shell px-gutter pb-section pt-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-button text-tertiary">
            <li>
              <Link href="/watch" className="link-draw">
                Archive
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/watch?source=${item.source}`} className="link-draw">
                {item.source}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <MediaPlayer item={item} />

            <h1 className="display mt-8 text-section">{item.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-button text-tertiary">
              {item.published_at && (
                <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
              )}
              {duration && <span className="tabular-nums">{duration}</span>}
              {views && <span className="tabular-nums">{views} views</span>}
              <a
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="link-draw"
              >
                Open on {item.source} ↗
              </a>
            </div>

            {item.description && (
              <div className="mt-8 border-t border-faint pt-8">
                <p className="whitespace-pre-line text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <h2 className="eyebrow mb-5">More from {item.source}</h2>
            {related.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-1">
                {related.slice(0, 4).map((r) => (
                  <MediaCard key={r.id} item={r} group="related" />
                ))}
              </div>
            ) : (
              <p className="meta">Nothing else from this platform yet.</p>
            )}
            <Link href="/watch" className="btn btn-secondary mt-8 w-full">
              <span>Full archive</span>
            </Link>
          </aside>
        </div>
      </article>

      <JsonLd
        data={[
          ...(video ? [video] : []),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Archive", path: "/watch" },
            { name: item.title, path: canonical },
          ]),
        ]}
      />
    </>
  );
}
