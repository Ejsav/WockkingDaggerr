"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/types";
import { formatDuration, formatCompactNumber, formatRelativeDate } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YOUTUBE",
  tiktok: "TIKTOK",
  instagram: "INSTAGRAM",
  twitch: "TWITCH",
};

function ytThumb(videoId: string, quality: "maxresdefault" | "hqdefault" | "mqdefault"): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

export default function VideoCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const [thumbQuality, setThumbQuality] = useState<"api" | "maxres" | "hq" | "mq" | "failed">("api");

  function currentSrc(): string | null {
    if (thumbQuality === "failed") return null;
    if (post.platform === "youtube" && post.external_id) {
      if (thumbQuality === "api" && post.thumbnail_url && !post.thumbnail_url.startsWith("/")) {
        return post.thumbnail_url;
      }
      if (thumbQuality === "api" || thumbQuality === "maxres") return ytThumb(post.external_id, "maxresdefault");
      if (thumbQuality === "hq") return ytThumb(post.external_id, "hqdefault");
      if (thumbQuality === "mq") return ytThumb(post.external_id, "mqdefault");
    }
    return post.thumbnail_url ?? null;
  }

  function handleImgError() {
    setThumbQuality((q) => {
      if (q === "api") return "maxres";
      if (q === "maxres") return "hq";
      if (q === "hq") return "mq";
      return "failed";
    });
  }

  const src = currentSrc();
  const showPlaceholder = !src || thumbQuality === "failed";

  // YouTube posts get internal watch page; others link to the platform
  const href =
    post.platform === "youtube"
      ? `/watch/youtube/${post.external_id}`
      : (post.permalink ?? "#");

  const isExternal = post.platform !== "youtube";

  const card = (
    <article className="card-lift relative overflow-hidden border border-white/5 bg-ink-700 hover:border-blade/40">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-ink-800">
        {showPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-800">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-blade/20">
              <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" fill="currentColor" />
            </svg>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={handleImgError}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-bone/30 bg-ink/50 transition-all duration-300 group-hover:scale-110 group-hover:border-blade group-hover:bg-blade md:h-16 md:w-16">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 text-bone">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </span>
        </div>

        {/* Platform badge */}
        <span className="absolute left-3 top-3 bg-blade px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-bone">
          {PLATFORM_LABELS[post.platform] ?? post.platform.toUpperCase()}
        </span>

        {/* Duration */}
        {post.duration_seconds != null && post.duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-bone">
            {formatDuration(post.duration_seconds)}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 md:p-5">
        <h3 className="line-clamp-2 font-display text-lg uppercase leading-tight tracking-tight text-bone md:text-xl">
          {post.title}
        </h3>
        <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-bone/45">
          <span>{formatRelativeDate(post.posted_at)}</span>
          <span>
            {post.view_count != null ? `${formatCompactNumber(post.view_count)} views` : ""}
          </span>
        </div>
      </div>
    </article>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {card}
      </a>
    );
  }

  return (
    <Link href={href} className="group block">
      {card}
    </Link>
  );
}
