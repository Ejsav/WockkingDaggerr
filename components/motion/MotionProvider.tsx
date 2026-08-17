"use client";

import { useEffect } from "react";

// ============================================================
// MOTION RUNTIME
//
// Three responsibilities, in this order of importance:
//   1. Respect prefers-reduced-motion. When set, nothing here
//      initialises and the CSS fallbacks make every revealed
//      element visible immediately.
//   2. Drive [data-reveal] and .line-mask into their .is-in
//      state as they enter the viewport.
//   3. Add smoothed scrolling (Lenis) on pointer devices.
//
// GSAP and Lenis are imported dynamically so neither lands in
// the bundle of a visitor who has reduced motion on.
//
// Everything animates transform and opacity only — never top,
// left, width, height or margin — so nothing here can trigger
// layout and nothing contributes to CLS.
// ============================================================

const REVEAL_STAGGER_MS = 90;

export default function MotionProvider() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("no-js");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let cleanup = () => {};

    const start = () => {
      if (reducedMotion.matches) {
        root.classList.add("motion-off");
        // Everything is already visible via CSS; make it explicit for
        // anything added after hydration.
        document
          .querySelectorAll<HTMLElement>("[data-reveal], .line-mask")
          .forEach((el) => el.classList.add("is-in"));
        return;
      }

      root.classList.remove("motion-off");
      cleanup = init();
    };

    start();

    // A visitor can flip the OS setting mid-session.
    const onChange = () => {
      cleanup();
      cleanup = () => {};
      start();
    };
    reducedMotion.addEventListener("change", onChange);

    return () => {
      reducedMotion.removeEventListener("change", onChange);
      cleanup();
    };
  }, []);

  return null;
}

function init(): () => void {
  const disposers: Array<() => void> = [];
  let cancelled = false;

  // ---- reveals: IntersectionObserver, not a scroll handler
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;

        // Stagger siblings that share a group so grids arrive in sequence.
        const group = el.dataset.revealGroup;
        if (group) {
          const peers = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-reveal-group="${group}"]`)
          );
          const index = peers.indexOf(el);
          el.style.setProperty("--reveal-delay", `${Math.max(0, index) * REVEAL_STAGGER_MS}ms`);
        }

        el.classList.add("is-in");
        observer.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
  );

  document
    .querySelectorAll<HTMLElement>("[data-reveal], .line-mask")
    .forEach((el) => observer.observe(el));

  disposers.push(() => observer.disconnect());

  // ---- smooth scroll + parallax, pointer devices only
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  void (async () => {
    try {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      let lenis: InstanceType<typeof Lenis> | null = null;

      if (finePointer) {
        lenis = new Lenis({
          duration: 1.05,
          // Short, weighted ease. Enough to feel considered, not enough
          // to fight the wheel — this is not scroll-jacking: one wheel
          // notch still moves one notch, it just settles.
          easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          wheelMultiplier: 1,
          touchMultiplier: 1,
          smoothWheel: true,
        });

        const raf = (time: number) => lenis?.raf(time);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        lenis.on("scroll", ScrollTrigger.update);

        disposers.push(() => {
          gsap.ticker.remove(raf);
          lenis?.destroy();
        });
      }

      // ---- parallax: subtle depth on marked media, transform only
      const parallax = gsap.utils.toArray<HTMLElement>("[data-parallax]");
      for (const el of parallax) {
        const depth = Number(el.dataset.parallax) || 0.12;
        const tween = gsap.fromTo(
          el,
          { yPercent: -depth * 100 },
          {
            yPercent: depth * 100,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
        disposers.push(() => {
          tween.scrollTrigger?.kill();
          tween.kill();
        });
      }

      // ---- counters: numbers roll up once, in place
      const counters = gsap.utils.toArray<HTMLElement>("[data-count-to]");
      for (const el of counters) {
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) continue;
        const state = { value: 0 };
        const tween = gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(state.value).toLocaleString("en-US");
          },
        });
        disposers.push(() => {
          tween.scrollTrigger?.kill();
          tween.kill();
        });
      }

      ScrollTrigger.refresh();
      disposers.push(() => ScrollTrigger.killAll());
    } catch {
      // If the motion bundle fails to load the site is unaffected:
      // the IntersectionObserver above has already revealed content.
    }
  })();

  return () => {
    cancelled = true;
    for (const dispose of disposers) dispose();
  };
}
