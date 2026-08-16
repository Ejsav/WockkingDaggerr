"use client";

import { useEffect, useRef, useState } from "react";
import TwitchPlayer from "@/components/media/TwitchPlayer";
import type { LiveResponse } from "@/app/api/live/route";
import { WD } from "@/lib/wockkingdagger";

const POLL_INTERVAL_MS = 30_000;

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
  const [data, setData] = useState<LiveResponse | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [muted, setMuted] = useState(true);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const json: LiveResponse = await res.json();
      setData(json);
      if (json.isLive) setCollapsed(false); // auto-expand when stream starts
    } catch {
      // silent fail, retry on next tick
    }
  }

  useEffect(() => {
    poll();
    interval.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, []);

  // Not live — render nothing
  if (!data?.isLive) return null;

  return (
    <div className="relative z-40 border-b-2 border-blade bg-ink-800">
      {/* ── TOP BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blade/20 bg-blade/10 px-4 py-3 md:px-6">
        {/* Left — live indicator + stream info */}
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

        {/* Right — controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="border border-white/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone/60 transition-colors hover:border-bone hover:text-bone"
            aria-label={muted ? "Unmute stream" : "Mute stream"}
          >
            {muted ? "UNMUTE" : "MUTE"}
          </button>

          <a
            href={WD.twitch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blade px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone transition-opacity hover:opacity-80"
          >
            OPEN TWITCH →
          </a>

          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand player" : "Collapse player"}
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-bone/50 hover:text-bone"
          >
            <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── PLAYER ── */}
      {!collapsed && (
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "72vh" }}>
          <TwitchPlayer
            type="live"
            channel={data.channelLogin}
            autoplay={true}
            muted={muted}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
