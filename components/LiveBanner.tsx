"use client";

import { useState } from "react";
import TwitchPlayer from "@/components/media/TwitchPlayer";
import { useLive } from "@/components/LiveProvider";
import { WD } from "@/lib/wockkingdagger";

function formatViewers(n: number | null): string {
  if (n === null) return "";
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n / 1000)}K`;
}

function formatStreamDuration(startedAt: string | null): string {
  if (!startedAt) return "";
  const diff = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LiveBanner() {
  const data = useLive();
  const [collapsed, setCollapsed] = useState(true);
  const [muted, setMuted] = useState(true);

  if (!data?.isLive) return null;

  return (
    <div className="relative z-40 border-b-2 border-blade bg-ink-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blade/20 bg-blade/10 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-3 md:gap-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blade opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blade" />
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-blade">
              LIVE NOW
            </span>
          </div>

          <span className="h-3 w-px bg-white/15" aria-hidden />

          <div className="flex flex-wrap items-center gap-3">
            {data.viewerCount != null && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone/70">
                {formatViewers(data.viewerCount)} watching
              </span>
            )}
            {data.game && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                {data.game}
              </span>
            )}
            {data.startedAt && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
                {formatStreamDuration(data.startedAt)}
              </span>
            )}
            {data.title && (
              <span className="max-w-[260px] truncate text-sm text-bone/75 md:max-w-md">
                {data.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!collapsed && (
            <button
              onClick={() => setMuted((value) => !value)}
              className="min-h-11 border border-white/15 px-3 font-mono text-[10px] uppercase tracking-widest text-bone/60 transition-colors hover:border-bone hover:text-bone"
              aria-label={muted ? "Unmute stream" : "Mute stream"}
            >
              {muted ? "UNMUTE" : "MUTE"}
            </button>
          )}

          <a
            href={WD.twitch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center bg-blade px-3 font-mono text-[10px] uppercase tracking-widest text-bone transition-transform hover:-translate-y-0.5"
          >
            OPEN TWITCH →
          </a>

          <button
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Load live player" : "Collapse live player"}
            className="flex h-11 min-w-11 items-center justify-center border border-white/15 px-3 font-mono text-[10px] uppercase tracking-widest text-bone/70 transition-colors hover:border-bone hover:text-bone"
          >
            {collapsed ? "WATCH HERE" : "HIDE"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "72vh" }}>
          <TwitchPlayer
            type="live"
            channel={data.channelLogin}
            autoplay
            muted={muted}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
