"use client";

import { useState } from "react";

// ============================================================
// INSTAGRAM EMBED
// Uses Instagram's official /embed/ iframe URL for public posts.
// No API credentials required — works for any public post URL.
//
// Usage:
//   <InstagramEmbed shortcode="ABC123def" />
// ============================================================

interface InstagramEmbedProps {
  shortcode: string;
  caption?: string;
  className?: string;
}

export default function InstagramEmbed({
  shortcode,
  caption,
  className = "",
}: InstagramEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ paddingTop: "0" }}>
      {/* Loading skeleton */}
      {!loaded && (
        <div
          className="flex items-center justify-center border border-white/5 bg-ink-700"
          style={{ height: "560px" }}
        >
          <div className="text-center">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-bone/40 animate-pulse">
              Loading post...
            </div>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest text-blade hover:underline"
            >
              VIEW ON INSTAGRAM →
            </a>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        className={`w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        height="560"
        scrolling="no"
        allowTransparency
        frameBorder="0"
        title={caption ?? `Instagram post by @wockkingdaggerr`}
        onLoad={() => setLoaded(true)}
        style={{
          background: "transparent",
          maxWidth: "540px",
          width: "100%",
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  );
}
