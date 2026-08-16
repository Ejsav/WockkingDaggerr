"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SOCIALS } from "@/lib/socials";

const NAV_ITEMS = [
  { label: "WATCH", href: "/watch" },
  { label: "SHOP", href: "/shop" },
  { label: "DROPS", href: "/drops" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/5 bg-ink/85 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-10 md:py-5">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3" aria-label="WockkingDagger home">
          <BladeMark className="h-6 w-6 text-blade transition-transform group-hover:rotate-[8deg]" />
          <span className="font-display text-lg leading-none tracking-wider">
            WOCKKING<span className="text-blade">DAGGER</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-mono text-xs font-medium tracking-widest transition-colors",
                  active ? "text-blade" : "text-bone/70 hover:text-bone"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Divider */}
          <span className="h-4 w-px bg-white/15" aria-hidden />

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {NAV_SOCIALS.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-bone/45 transition-colors hover:text-bone"
              >
                <SocialIcon platform={s.label} className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={cn("h-px w-6 bg-bone transition-all duration-300", open && "translate-y-[7px] rotate-45")} />
          <span className={cn("h-px w-6 bg-bone transition-all duration-300", open && "opacity-0")} />
          <span className={cn("h-px w-6 bg-bone transition-all duration-300", open && "-translate-y-[7px] -rotate-45")} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 top-[68px] z-40 bg-ink transition-all duration-500 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="flex flex-col px-6 pt-10">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-white/10 py-6 font-display text-5xl uppercase tracking-tight transition-colors hover:text-blade"
              style={{ animation: open ? `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.08 + 0.15}s both` : undefined }}
            >
              {item.label}
            </Link>
          ))}

          {/* Social links in mobile menu */}
          <div
            className="mt-10 flex flex-wrap items-center gap-6"
            style={{ animation: open ? "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.42s both" : undefined }}
          >
            {NAV_SOCIALS.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/60 hover:text-bone"
              >
                <SocialIcon platform={s.label} className="h-4 w-4" />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function BladeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" fill="currentColor" />
    </svg>
  );
}

// Inline SVG social icons — no external dependency
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const cls = cn("fill-current", className);
  switch (platform.toLowerCase()) {
    case "twitch":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      );
    case "kick":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M1 2h4v7.5L9.5 6H15l-6 6 6 6H9.5L5 14.5V22H1V2zm14 0h4v7.5L23.5 6H24v4l-3.5 2 3.5 2v4h-.5L19 14.5V22h-4V2z" />
        </svg>
      );
    case "youtube":
    case "youtube live":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    default:
      return null;
  }
}
