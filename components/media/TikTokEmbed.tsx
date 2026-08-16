"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { FEATURED_TIKTOKS } from "@/lib/featured-content";
import { WD } from "@/lib/wockkingdagger";

const DEFAULT_ROTATION_MS = 16_000;
const MIN_ROTATION_MS = 8_000;
const MAX_ROTATION_MS = 60_000;

interface TikTokEmbedProps {
  videoId: string;
  className?: string;
}

declare global {
  interface Window {
    tiktok?: {
      embeds?: { render: (el: HTMLElement | null) => void };
    };
  }
}

function getRotationMs(): number {
  const configured = Number(
    process.env.NEXT_PUBLIC_TIKTOK_ROTATION_MS ?? DEFAULT_ROTATION_MS,
  );

  if (!Number.isFinite(configured)) return DEFAULT_ROTATION_MS;
  return Math.min(MAX_ROTATION_MS, Math.max(MIN_ROTATION_MS, configured));
}

function TikTokEmbedInstance({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const username = WD.tiktok.username;
  const videoUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

  const renderEmbed = useCallback(() => {
    if (typeof window === "undefined" || !window.tiktok?.embeds) return;
    try {
      window.tiktok.embeds.render(containerRef.current);
    } catch {
      // The branded fallback link remains usable if TikTok's embed script fails.
    }
  }, []);

  useEffect(() => {
    renderEmbed();
  }, [videoId, renderEmbed]);

  return (
    <div
      ref={containerRef}
      className="tiktok-embed-instance"
      style={{ minHeight: "560px", position: "relative" }}
    >
      <blockquote
        className="tiktok-embed"
        cite={videoUrl}
        data-video-id={videoId}
        data-embed-from="oembed"
        style={{
          maxWidth: "605px",
          minWidth: "0px",
          width: "100%",
          margin: "0 auto",
        }}
      >
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
        onLoad={renderEmbed}
      />
    </div>
  );
}

export default function TikTokEmbed({ videoId, className = "" }: TikTokEmbedProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [inViewport, setInViewport] = useState(false);
  const rotationMs = getRotationMs();

  const playlist = useMemo(() => {
    const approvedIds = FEATURED_TIKTOKS.map((video) => video.videoId);
    if (approvedIds.length === 0) return [videoId];

    const startIndex = approvedIds.indexOf(videoId);
    if (startIndex <= 0) return approvedIds;

    return [
      ...approvedIds.slice(startIndex),
      ...approvedIds.slice(0, startIndex),
    ];
  }, [videoId]);

  const activeVideoId = playlist[index % playlist.length] ?? videoId;

  useEffect(() => {
    setIndex(0);
    setCycle((value) => value + 1);
  }, [videoId]);

  useEffect(() => {
    const handleVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const node = shellRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { rootMargin: "240px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!documentVisible || !inViewport || playlist.length < 2) return;

    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % playlist.length);
      setCycle((value) => value + 1);
    }, rotationMs);

    return () => window.clearTimeout(timer);
  }, [documentVisible, inViewport, playlist.length, rotationMs, activeVideoId]);

  return (
    <div ref={shellRef} className={`tiktok-embed-wrapper ${className}`}>
      <TikTokEmbedInstance
        key={`${activeVideoId}-${cycle}`}
        videoId={activeVideoId}
      />

      {playlist.length > 1 && (
        <div className="mt-3 flex min-h-11 items-center justify-between border border-white/5 bg-ink-700/60 px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-bone/50">
            Controlled rotation {index + 1}/{playlist.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setIndex((current) => (current + 1) % playlist.length);
              setCycle((value) => value + 1);
            }}
            className="min-h-11 px-3 font-mono text-[10px] uppercase tracking-widest text-blade transition-colors hover:text-bone"
            aria-label="Load the next approved WockkingDagger TikTok"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
