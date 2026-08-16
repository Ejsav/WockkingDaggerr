"use client";

import { useState } from "react";
import Image from "next/image";

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  deferUntilInteraction?: boolean;
  className?: string;
}

export default function YouTubePlayer({
  videoId,
  title = "YouTube video",
  autoplay = false,
  deferUntilInteraction = true,
  className = "",
}: YouTubePlayerProps) {
  const [active, setActive] = useState(autoplay || !deferUntilInteraction);

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className={`group relative h-full w-full overflow-hidden bg-ink-800 text-left ${className}`}
        aria-label={`Play ${title}`}
      >
        <Image
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 960px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/60 text-bone backdrop-blur-sm transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        <span className="absolute bottom-4 left-4 right-4 font-mono text-[10px] uppercase tracking-widest text-bone/80">
          Play on site
        </span>
      </button>
    );
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    color: "red",
    playsinline: "1",
    ...(autoplay || deferUntilInteraction ? { autoplay: "1" } : {}),
  });

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

  return (
    <iframe
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={`h-full w-full border-0 ${className}`}
    />
  );
}
