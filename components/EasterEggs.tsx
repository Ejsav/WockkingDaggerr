"use client";

import { useEffect, useState } from "react";

// ------------------------------------------------------------
// EASTER EGGS — type "dagger" anywhere (outside of inputs)
// and the blade answers. Zero UI cost until triggered.
// ------------------------------------------------------------

const TRIGGER = "dagger";

const QUOTES = [
  "YOU FOUND THE BLADE.",
  "SHARP EYES. SHARPER BLADE.",
  "THE VAULT SEES YOU.",
  "OK, YOU'RE ONE OF US NOW.",
];

export default function EasterEggs() {
  const [active, setActive] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    let buffer = "";
    let hideTimer = 0;

    function onKey(e: KeyboardEvent) {
      // Never hijack typing in form fields
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.length !== 1) return;

      buffer = (buffer + e.key.toLowerCase()).slice(-TRIGGER.length);
      if (buffer === TRIGGER) {
        buffer = "";
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        setActive(true);
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => setActive(false), 1600);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center"
    >
      {/* Blade slash flash */}
      <div className="absolute inset-0 bg-blade/10 blade-flash" />
      <div className="flex flex-col items-center gap-4">
        <svg viewBox="0 0 24 24" fill="#c8102e" className="blade-flash h-16 w-16" aria-hidden>
          <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
        </svg>
        <p className="boot-wordmark font-display text-2xl uppercase tracking-wider text-bone md:text-4xl">
          {quote}
        </p>
      </div>
    </div>
  );
}
