"use client";

import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/utils";

// ============================================================
// DROP COUNTDOWN
//
// Server-rendered from the same pure function the client uses,
// so the first paint already shows a real figure and hydration
// does not flash.
//
// The interval stops while the tab is hidden: a backgrounded tab
// should not burn a timer for a clock nobody is reading.
// ============================================================

const UNITS = ["Days", "Hours", "Mins", "Secs"] as const;

export default function Countdown({
  targetIso,
  onCompleteLabel = "Doors are open",
}: {
  targetIso: string;
  onCompleteLabel?: string;
}) {
  const [state, setState] = useState(() => getCountdown(targetIso));

  useEffect(() => {
    const tick = () => setState(getCountdown(targetIso));
    tick();

    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timer === null) timer = setInterval(tick, 1000);
    };
    const stopTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        tick(); // catch up immediately on return
        startTimer();
      }
    };

    if (!document.hidden) startTimer();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [targetIso]);

  if (state.done) {
    return (
      <p className="font-display text-section uppercase tracking-display text-blade-text">
        {onCompleteLabel}
      </p>
    );
  }

  const values = [state.days, state.hours, state.minutes, state.seconds];

  return (
    <div>
      <dl className="flex gap-2 xs:gap-3">
        {UNITS.map((unit, i) => (
          <div
            key={unit}
            className="flex-1 border border-faint bg-surface-1 px-1 py-3 text-center xs:px-2 xs:py-4"
          >
            <dd className="font-display text-[clamp(1.75rem,7vw,3.25rem)] leading-none tabular-nums">
              {values[i].toString().padStart(2, "0")}
            </dd>
            <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-button text-tertiary">
              {unit}
            </dt>
          </div>
        ))}
      </dl>
      {/* One polite announcement per minute — a per-second live region
          would flood a screen reader. */}
      <p className="sr-only" aria-live="polite">
        {state.days} days, {state.hours} hours and {state.minutes} minutes remaining.
      </p>
    </div>
  );
}
