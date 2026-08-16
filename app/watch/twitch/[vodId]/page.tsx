import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import TwitchPlayer from "@/components/media/TwitchPlayer";
import { getMediaItem, getMediaBySource } from "@/lib/media";
import { formatCompactNumber, formatDate, formatDuration } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { vodId: string } }): Promise<Metadata> {
  const item = getMediaItem(`twitch_${params.vodId}`);
  if (!item) return { title: "VOD not found" };
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wockkingdagger.com";
  const desc = item.description?.slice(0, 160) ?? `Watch ${item.title} on WockkingDagger.`;
  return {
    title: item.title,
    description: desc,
    openGraph: {
      title: item.title,
      description: desc,
      type: "video.other",
      url: `${BASE}/watch/twitch/${params.vodId}`,
      images: item.thumbnail ? [{ url: item.thumbnail, width: 640, height: 360 }] : [],
    },
    twitter: { card: "summary_large_image", title: item.title, description: desc, creator: "@wockkingdaggerr" },
  };
}

export default async function TwitchVodPage({ params }: { params: { vodId: string } }) {
  const item = getMediaItem(`twitch_${params.vodId}`);
  if (!item) notFound();

  const related = getMediaBySource("twitch")
    .filter((v) => v.externalId !== params.vodId)
    .slice(0, 6);

  return (
    <div className="min-h-screen pt-20 md:pt-28">
      <div className="mx-auto max-w-[1500px] px-5 pb-20 md:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/35">
          <Link href="/watch" className="hover:text-bone transition-colors">Archive</Link>
          <span className="text-bone/20">/</span>
          <span className="text-bone/55">Twitch VOD</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Player */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video overflow-hidden border border-white/[0.06] bg-ink-800">
              <TwitchPlayer type="vod" vodId={params.vodId} autoplay={false} />
            </div>

            {/* Meta */}
            <div className="mt-5 border-b border-white/[0.08] pb-5">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="border border-white/20 bg-ink/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-bone/80">TWITCH VOD</span>
                {item.duration != null && item.duration > 0 && (
                  <span className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-bone/55">
                    {formatDuration(item.duration)}
                  </span>
                )}
              </div>
              <h1 className="display text-[clamp(1.6rem,3.5vw,3rem)] leading-[0.95] text-bone">{item.title}</h1>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-bone/45">
                  {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                  {item.viewCount != null && <span>{formatCompactNumber(item.viewCount)} views</span>}
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bone/50 hover:text-blade transition-colors">
                  ↗ Twitch
                </a>
              </div>
            </div>

            {item.description && item.description.trim().length > 3 && (
              <div className="mt-5">
                <p className="eyebrow mb-2">About this stream</p>
                <p className="max-w-2xl text-sm leading-relaxed text-bone/60">{item.description.slice(0, 400)}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {related.length > 0 && (
            <aside className="lg:col-span-4">
              <p className="eyebrow-blade mb-4">More VODs</p>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <Link key={r.externalId} href={`/watch/twitch/${r.externalId}`}
                    className="group flex gap-3 border border-white/[0.05] bg-ink-700 transition-colors hover:border-blade/35">
                    <div className="relative aspect-video w-[110px] shrink-0 overflow-hidden bg-ink-800 md:w-[128px]">
                      {r.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumbnail} alt={r.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-400 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-ink-700" />
                      )}
                      {r.duration != null && r.duration > 0 && (
                        <span className="absolute bottom-1 right-1 bg-ink/80 px-1 font-mono text-[8px] text-bone">{formatDuration(r.duration)}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3">
                      <h3 className="line-clamp-2 text-xs font-medium leading-snug text-bone md:text-sm">{r.title}</h3>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-bone/40">
                        {r.viewCount != null ? `${formatCompactNumber(r.viewCount)}v · ` : ""}
                        {r.publishedAt ? formatDate(r.publishedAt) : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/watch" className="mt-4 flex items-center justify-center gap-2 border border-white/[0.08] py-3 font-mono text-[10px] uppercase tracking-widest text-bone/40 hover:border-blade/40 hover:text-blade transition-colors">
                ← Full archive
              </Link>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
