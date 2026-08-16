"use client";

import { useMemo } from "react";

interface TwitchPlayerProps {
  type: "live" | "vod";
  channel?: string;
  vodId?: string;
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
}

function getParentDomain(): string {
  const raw = process.env.NEXT_PUBLIC_TWITCH_PARENT_DOMAIN ?? "";
  if (raw) return raw;
  if (typeof window !== "undefined") return window.location.hostname;
  return "localhost";
}

export default function TwitchPlayer({
  type,
  channel,
  vodId,
  autoplay = false,
  muted = true,
  className = "",
}: TwitchPlayerProps) {
  const src = useMemo(() => {
    const parent = getParentDomain();
    const params = new URLSearchParams();

    if (type === "live" && channel) {
      params.set("channel", channel);
    } else if (type === "vod" && vodId) {
      params.set("video", vodId);
    } else {
      return null;
    }

    params.set("parent", parent);
    params.set("autoplay", autoplay ? "true" : "false");
    params.set("muted", muted ? "true" : "false");

    return `https://player.twitch.tv/?${params.toString()}`;
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
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={`h-full w-full border-0 ${className}`}
      title={type === "live" ? `${channel} live on Twitch` : `Twitch VOD ${vodId}`}
    />
  );
}
