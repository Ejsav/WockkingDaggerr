"use client";

import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/utils";

export default function DropCountdown({
  targetIso,
  variant = "default",
}: {
  targetIso: string;
  variant?: "default" | "compact";
}) {
  // Date.now() is read only after hydration. Computing the initial tick during
  // render makes the server and client disagree (e.g. SEC 51 vs 50) and throws
  // a hydration mismatch.
  const [tick, setTick] = useState<ReturnType<typeof getCountdown> | null>(null);

  useEffect(() => {
    const update = () => setTick(getCountdown(targetIso));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (!tick) {
    if (variant === "compact") {
      return (
        <span className="font-mono text-xs uppercase tracking-widest text-bone/40">
          SYNCING...
        </span>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        <Unit value={0} label="DAYS" />
        <Unit value={0} label="HOURS" />
        <Unit value={0} label="MIN" />
        <Unit value={0} label="SEC" accent />
      </div>
    );
  }

  if (tick.totalMs <= 0) {
    return (
      <span className="font-mono text-xs uppercase tracking-widest text-blade">
        ● LIVE NOW
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span className="font-mono text-xs uppercase tracking-widest text-bone/70">
        IN {tick.days}D {tick.hours}H {tick.minutes}M
      </span>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 md:gap-6">
      <Unit value={tick.days} label="DAYS" />
      <Unit value={tick.hours} label="HOURS" />
      <Unit value={tick.minutes} label="MIN" />
      <Unit value={tick.seconds} label="SEC" accent />
    </div>
  );
}

function Unit({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="border border-white/10 bg-ink/40 px-3 py-4 text-center backdrop-blur-sm md:px-5 md:py-6">
      <p
        className={`font-display text-4xl md:text-6xl ${
          accent ? "text-blade" : "text-bone"
        }`}
      >
        {value.toString().padStart(2, "0")}
      </p>
      <p className="mt-1 font-mono text-[9px] tracking-widest text-bone/50 md:text-[10px]">
        {label}
      </p>
    </div>
  );
}
