"use client";

import { useEffect, useRef, useState } from "react";

// ------------------------------------------------------------
// BOOT SCREEN — signature WockkingDagger loading sequence.
// Stream-style boot: blade mark draws in, wordmark glitch-reveals,
// rotating status lines, integrated progress readout.
//
// - Runs ONCE per session (sessionStorage gate)
// - Reduced motion => instant, near-invisible fade
// - Total duration ~1.6s. Fast on purpose.
// ------------------------------------------------------------

const SESSION_KEY = "wd_booted";

const BOOT_LINES = [
  "SHARPENING THE BLADE",
  "PULLING THE ARCHIVE",
  "CHECKING THE STREAM",
  "LOADING THE RECORD",
];

// Rare alternate line — small easter egg (~1 in 12 boots)
const RARE_LINE = "YOU WEREN'T SUPPOSED TO SEE THIS ONE";

type Phase = "boot" | "exit" | "done";

export default function BootScreen() {
  const [phase, setPhase] = useState<Phase>("done");
  const [progress, setProgress] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const linesRef = useRef<string[]>(BOOT_LINES);

  useEffect(() => {
    // Session gate — never replay within the same tab session
    let alreadyBooted = true;
    try {
      alreadyBooted = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadyBooted = true;
    }
    if (alreadyBooted) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode — still show once */
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // Minimal: brief black frame, no animation sequence
      setPhase("exit");
      const t = window.setTimeout(() => setPhase("done"), 250);
      return () => window.clearTimeout(t);
    }

    // 1-in-12 rare alternate boot line
    if (Math.random() < 1 / 12) {
      linesRef.current = [RARE_LINE, ...BOOT_LINES.slice(1)];
    }

    setPhase("boot");

    // Progress: fast, uneven ticks — feels like a real boot, ends at 100
    const start = performance.now();
    const DURATION = 1150;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      // Ease with a couple of "catch" points for texture
      const eased = t < 0.6 ? t * 1.35 : 0.81 + (t - 0.6) * 0.475;
      setProgress(Math.min(Math.round(eased * 100), 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const lineTimer = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % linesRef.current.length);
    }, 340);

    const exitTimer = window.setTimeout(() => setPhase("exit"), DURATION + 120);
    const doneTimer = window.setTimeout(() => setPhase("done"), DURATION + 620);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(lineTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className={`boot-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink ${
        phase === "exit" ? "boot-exit" : ""
      }`}
    >
      {/* Scanline texture */}
      <div className="boot-scanlines pointer-events-none absolute inset-0 opacity-[0.07]" />

      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* Blade mark — stroke draws itself in */}
        <svg viewBox="0 0 24 24" fill="none" className="h-14 w-14 md:h-16 md:w-16" aria-hidden>
          <path
            d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z"
            stroke="#c8102e"
            strokeWidth="1"
            className="boot-blade-draw"
          />
          <path
            d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z"
            fill="#c8102e"
            className="boot-blade-fill"
          />
        </svg>

        {/* Wordmark — glitch reveal */}
        <p
          className="boot-wordmark font-display text-3xl uppercase tracking-wider text-bone md:text-5xl"
          data-text="WOCKKINGDAGGER"
        >
          WOCKKING<span className="text-blade">DAGGER</span>
        </p>

        {/* Status line + progress */}
        <div className="flex w-64 flex-col items-center gap-3 md:w-80">
          <div className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-widest text-bone/40">
            <span className="boot-status-line" key={lineIndex}>
              {linesRef.current[lineIndex]}
            </span>
            <span className="tabular-nums text-blade">{progress}%</span>
          </div>
          <div className="h-px w-full bg-white/10">
            <div
              className="h-px bg-blade transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
