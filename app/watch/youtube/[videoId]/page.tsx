import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import YouTubePlayer from "@/components/media/YouTubePlayer";
import { getCachedPosts } from "@/lib/post-cache";
import { getVisiblePosts } from "@/lib/mock-data";
import { autoSyncYouTube } from "@/lib/auto-sync";
import { formatCompactNumber, formatDate, formatDuration } from "@/lib/utils";
import type { Post } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allPosts(): Post[] {
  const c = getCachedPosts();
  return c.length > 0 ? c : getVisiblePosts();
}

function getPost(videoId: string): Post | null {
  return allPosts().find((p) => p.platform === "youtube" && p.external_id === videoId) ?? null;
}

export async function generateMetadata({ params }: { params: { videoId: string } }): Promise<Metadata> {
  await autoSyncYouTube();
  const post = getPost(params.videoId);
  if (!post) return { title: "Video not found" };
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wockkingdagger.com";
  const desc = post.description?.slice(0, 160) ?? `Watch ${post.title} on WockkingDagger.`;
  return {
    title: post.title,
    description: desc,
    openGraph: {
      title: post.title,
      description: desc,
      type: "video.other",
      url: `${BASE}/watch/youtube/${params.videoId}`,
      images: post.thumbnail_url ? [{ url: post.thumbnail_url, width: 1280, height: 720 }] : [],
    },
    twitter: { card: "summary_large_image", title: post.title, description: desc, creator: "@wockkingdaggerr" },
  };
}

export default async function YouTubeWatchPage({ params }: { params: { videoId: string } }) {
  await autoSyncYouTube();
  const post = getPost(params.videoId);
  if (!post) notFound();

  const related = allPosts()
    .filter((p) => p.platform === "youtube" && p.external_id !== params.videoId)
    .slice(0, 6);

  return (
    <div className="min-h-screen pt-20 md:pt-28">
      <div className="mx-auto max-w-[1500px] px-5 pb-20 md:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/35">
          <Link href="/watch" className="hover:text-bone transition-colors">Archive</Link>
          <span className="text-bone/20">/</span>
          <span className="text-bone/55">YouTube</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Player */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video overflow-hidden border border-white/[0.06] bg-ink-800">
              <YouTubePlayer videoId={params.videoId} title={post.title} autoplay={false} />
            </div>

            {/* Meta */}
            <div className="mt-5 border-b border-white/[0.08] pb-5">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="bg-blade px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-bone">YOUTUBE</span>
                {post.duration_seconds != null && post.duration_seconds > 0 && (
                  <span className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-bone/55">
                    {formatDuration(post.duration_seconds)}
                  </span>
                )}
              </div>
              <h1 className="display text-[clamp(1.6rem,3.5vw,3rem)] leading-[0.95] text-bone">{post.title}</h1>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-bone/45">
                  <span>{formatDate(post.posted_at)}</span>
                  {post.view_count != null && <span>{formatCompactNumber(post.view_count)} views</span>}
                </div>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bone/50 hover:text-blade transition-colors">
                    ↗ YouTube
                  </a>
                )}
              </div>
            </div>

            {post.description && post.description.trim().length > 3 && (
              <div className="mt-5">
                <p className="eyebrow mb-2">About</p>
                <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-bone/60">
                  {post.description.slice(0, 600)}{post.description.length > 600 && <span className="text-bone/30"> …</span>}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {related.length > 0 && (
            <aside className="lg:col-span-4">
              <p className="eyebrow-blade mb-4">More videos</p>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <Link key={r.external_id} href={`/watch/youtube/${r.external_id}`}
                    className="group flex gap-3 border border-white/[0.05] bg-ink-700 transition-colors hover:border-blade/35">
                    <div className="relative aspect-video w-[110px] shrink-0 overflow-hidden bg-ink-800 md:w-[128px]">
                      {r.thumbnail_url && !r.thumbnail_url.startsWith("/placeholders") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumbnail_url} alt={r.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-400 group-hover:scale-105" loading="lazy" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 bg-ink-700" />
                      )}
                      {r.duration_seconds != null && r.duration_seconds > 0 && (
                        <span className="absolute bottom-1 right-1 bg-ink/80 px-1 font-mono text-[8px] text-bone">{formatDuration(r.duration_seconds)}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3">
                      <h3 className="line-clamp-2 text-xs font-medium leading-snug text-bone md:text-sm">{r.title}</h3>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-bone/40">
                        {r.view_count != null ? `${formatCompactNumber(r.view_count)}v · ` : ""}{formatDate(r.posted_at)}
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
