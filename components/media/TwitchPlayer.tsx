"use client";

import { useMemo } from "react";

// ============================================================
// TWITCH PLAYER
// Handles both live channel embeds and VOD embeds.
// Parent domain is required by Twitch's embed policy.
// Reads NEXT_PUBLIC_TWITCH_PARENT_DOMAIN from env.
//
// Usage:
//   <TwitchPlayer type="live" channel="wockkingdaggerr" />
//   <TwitchPlayer type="vod" vodId="1234567890" />
// ============================================================

interface TwitchPlayerProps {
  type: "live" | "vod";
  channel?: string; // for live
  vodId?: string; // for VOD
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
}

function getParentDomain(): string {
  // NEXT_PUBLIC_ vars are safe to use in client components
  const raw = process.env.NEXT_PUBLIC_TWITCH_PARENT_DOMAIN ?? "";
  if (raw) return raw;

  // Fallback: derive from the browser's hostname at runtime
  if (typeof window !== "undefined") return window.location.hostname;
  return "localhost";
}

export default function TwitchPlayer({
  type,
  channel,
  vodId,
  autoplay = true,
  muted = false,
  className = "",
}: TwitchPlayerProps) {
  const src = useMemo(() => {
    const parent = getParentDomain();
    const base = "https://player.twitch.tv/?";
    const params = new URLSearchParams();

    if (type === "live" && channel) {
      params.set("channel", channel);
    } else if (type === "vod" && vodId) {
      params.set("video", vodId);
    } else {
      return null;
    }

    params.set("parent", parent);
    if (autoplay) params.set("autoplay", "true");
    if (muted) params.set("muted", "true");

    return base + params.toString();
  }, [type, channel, vodId, autoplay, muted]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-ink-800 ${className}`}>
        <p className="font-mono text-xs uppercase tracking-widest text-bone/40">
          PLAYER CONFIG ERROR
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      allowFullScreen
      allow="autoplay; fullscreen; picture-in-picture"
      className={`h-full w-full border-0 ${className}`}
      title={
        type === "live"
          ? `${channel} live on Twitch`
          : `Twitch VOD ${vodId}`
      }
      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
    />
  );
}
