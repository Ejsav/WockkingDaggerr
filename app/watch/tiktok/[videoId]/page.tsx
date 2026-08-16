import Link from "next/link";
import LiveBanner from "@/components/LiveBanner";
import TikTokEmbed from "@/components/media/TikTokEmbed";
import { FEATURED_TIKTOKS } from "@/lib/featured-content";
import type { Metadata } from "next";

interface Props {
  params: { videoId: string };
}

export function generateStaticParams() {
  return FEATURED_TIKTOKS.map((v) => ({ videoId: v.videoId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = FEATURED_TIKTOKS.find((v) => v.videoId === params.videoId);
  return {
    title: video?.caption
      ? `${video.caption} — WockkingDagger TikTok`
      : "TikTok — WockkingDagger",
    description: "Watch this TikTok from @wockkingdaggerr",
  };
}

export default function TikTokWatchPage({ params }: Props) {
  const video = FEATURED_TIKTOKS.find((v) => v.videoId === params.videoId);

  return (
    <>
      <LiveBanner />

      <div className="min-h-screen bg-ink pt-24 md:pt-32">
        <div className="mx-auto max-w-[680px] px-5 py-10 md:px-10">
          {/* Back nav */}
          <Link
            href="/watch"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/40 transition-colors hover:text-blade"
          >
            ← Back to Archive
          </Link>

          {/* Platform label */}
          <div className="mt-8 mb-4 flex items-center gap-3">
            <TikTokIcon className="h-4 w-4 text-bone/60" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-bone/45">
              @wockkingdaggerr on TikTok
            </span>
          </div>

          {/* Embed */}
          <TikTokEmbed videoId={params.videoId} />

          {/* Caption */}
          {video?.caption && (
            <p className="mt-6 font-display text-xl uppercase text-bone">
              {video.caption}
            </p>
          )}

          {/* Direct link */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <a
              href={video?.url ?? `https://www.tiktok.com/@wockkingdaggerr/video/${params.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/40 transition-colors hover:text-blade"
            >
              <TikTokIcon className="h-3.5 w-3.5" />
              Open on TikTok →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
    </svg>
  );
}
