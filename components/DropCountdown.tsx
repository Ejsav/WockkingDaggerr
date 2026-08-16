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
  // Start as null so the server render and the first client render are
  // identical (no live time value). The real countdown is computed only
  // after mount, avoiding a hydration text mismatch.
  const [tick, setTick] = useState<ReturnType<typeof getCountdown> | null>(null);

  useEffect(() => {
    setTick(getCountdown(targetIso));
    const interval = setInterval(() => setTick(getCountdown(targetIso)), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  // Deterministic placeholder shared by server and first client render.
  if (tick === null) {
    if (variant === "compact") {
      return (
        <span className="font-mono text-xs uppercase tracking-widest text-bone/70">
          IN —D —H —M
        </span>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        <Unit value={null} label="DAYS" />
        <Unit value={null} label="HOURS" />
        <Unit value={null} label="MIN" />
        <Unit value={null} label="SEC" accent />
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

function Unit({ value, label, accent }: { value: number | null; label: string; accent?: boolean }) {
  return (
    <div className="border border-white/10 bg-ink/40 px-3 py-4 text-center backdrop-blur-sm md:px-5 md:py-6">
      <p
        className={`font-display text-4xl md:text-6xl ${
          accent ? "text-blade" : "text-bone"
        }`}
      >
        {value === null ? "--" : value.toString().padStart(2, "0")}
      </p>
      <p className="mt-1 font-mono text-[9px] tracking-widest text-bone/50 md:text-[10px]">
        {label}
      </p>
    </div>
  );
}
