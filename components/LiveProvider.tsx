"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LiveResponse } from "@/app/api/live/route";

// ------------------------------------------------------------
// LIVE PRESENCE — single site-wide poll of /api/live.
// Navigation, LiveBanner, status readouts all consume this
// context so the site only ever runs ONE polling loop.
// ------------------------------------------------------------

const POLL_INTERVAL_MS = 60_000;

const LiveContext = createContext<LiveResponse | null>(null);

export function useLive(): LiveResponse | null {
  return useContext(LiveContext);
}

export default function LiveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LiveResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function pollLive() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json: LiveResponse = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Keep last known state; retry on next interval.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void pollLive();
    };

    void pollLive();
    const intervalId = window.setInterval(() => void pollLive(), POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // LIVE MODE — expose live state to CSS so the whole site can react
  useEffect(() => {
    document.documentElement.toggleAttribute("data-live", Boolean(data?.isLive));
  }, [data?.isLive]);

  return <LiveContext.Provider value={data}>{children}</LiveContext.Provider>;
}
