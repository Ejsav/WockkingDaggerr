"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { WD } from "@/lib/wockkingdagger";

// ============================================================
// TIKTOK EMBED
// Uses TikTok's official blockquote + embed.js approach.
// Renders the official TikTok embed iframe for public videos.
//
// Usage:
//   <TikTokEmbed videoId="7341234567890123456" />
// ============================================================

interface TikTokEmbedProps {
  videoId: string;
  className?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tiktok?: any;
  }
}

export default function TikTokEmbed({ videoId, className = "" }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const username = WD.tiktok.username;
  const videoUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

  useEffect(() => {
    // Re-trigger TikTok embed processing if script already loaded
    if (typeof window !== "undefined" && window.tiktok?.embeds) {
      try {
        window.tiktok.embeds.render(containerRef.current);
      } catch {
        // Silent — script may not expose this API in all versions
      }
    }
  }, [videoId]);

  return (
    <div
      ref={containerRef}
      className={`tiktok-embed-wrapper ${className}`}
      style={{ minHeight: "560px", position: "relative" }}
    >
      <blockquote
        className="tiktok-embed"
        cite={videoUrl}
        data-video-id={videoId}
        data-embed-from="oembed"
        style={{
          maxWidth: "605px",
          minWidth: "325px",
          margin: "0 auto",
        }}
      >
        {/* Loading state shown until embed.js processes this blockquote */}
        <section>
          <div className="flex items-center justify-center" style={{ height: "560px" }}>
            <div className="text-center">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-bone/40 animate-pulse">
                Loading TikTok...
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest text-blade hover:underline"
              >
                VIEW ON TIKTOK →
              </a>
            </div>
          </div>
        </section>
      </blockquote>

      <Script
        src="https://www.tiktok.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Script loaded — TikTok will auto-process blockquotes
        }}
      />
    </div>
  );
}
