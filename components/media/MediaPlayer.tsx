"use client";

import { useState } from "react";
import Image from "next/image";
import { WD } from "@/lib/wockkingdagger";
import { track } from "@/lib/analytics";
import type { MediaItem } from "@/types";

// ============================================================
// FACADE PLAYER
//
// The iframe is not mounted until the visitor asks for it. A
// third-party player is ~1MB of script and several cookies; on
// an archive page that nobody may play, that is the single
// largest thing we can avoid loading.
//
// The poster occupies the exact aspect box the iframe will, so
// swapping one for the other shifts nothing.
// ============================================================

function embedSrc(item: MediaItem): string | null {
  switch (item.source) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${item.external_id}?autoplay=1&rel=0&modestbranding=1`;
    case "twitch": {
      const parents = WD.twitch.parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
      return `https://player.twitch.tv/?video=${item.external_id}&${parents}&autoplay=true`;
    }
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${item.external_id}`;
    case "instagram":
      return item.embed_url;
    default:
      return null;
  }
}

const RATIO: Record<MediaItem["source"], string> = {
  youtube: "aspect-video",
  twitch: "aspect-video",
  tiktok: "aspect-[9/16] mx-auto max-w-[420px]",
  instagram: "aspect-square mx-auto max-w-[560px]",
};

export default function MediaPlayer({ item }: { item: MediaItem }) {
  const [playing, setPlaying] = useState(false);
  const src = embedSrc(item);

  // Nothing embeddable: send the visitor to the platform rather than
  // showing a player that cannot play.
  if (!src) {
    return (
      <div className={`grid place-items-center border border-faint bg-surface-1 ${RATIO[item.source]}`}>
        <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <span>Watch on {item.source}</span>
        </a>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden border border-faint bg-surface-2 ${RATIO[item.source]}`}>
      {playing ? (
        <iframe
          src={src}
          title={item.title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            track("media_played", { source: item.source, media_id: item.id });
          }}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play ${item.title}`}
        >
          {item.thumbnail_url && (
            <Image
              src={item.thumbnail_url}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
          )}
          <span aria-hidden className="absolute inset-0 bg-ink/35 transition-colors duration-base ease-out group-hover:bg-ink/20" />
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone/40 bg-ink/60 transition-transform duration-base ease-out group-hover:scale-110 group-hover:border-[var(--blade-text)]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7 text-bone">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
