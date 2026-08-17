"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SOCIALS } from "@/lib/wockkingdagger";
import { useCart } from "@/components/shop/CartProvider";
import SocialIcon from "@/components/site/SocialIcon";

const NAV_ITEMS = [
  { label: "Watch", href: "/watch" },
  { label: "Shop", href: "/shop" },
  { label: "Drops", href: "/drops" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { count, ready } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // The first read happens in a frame callback rather than the effect
    // body: a restored scroll position still gets the solid header, and
    // no state is set synchronously during the effect.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the menu on navigation by adjusting state during render — the
  // React-sanctioned alternative to a pathname effect, and it avoids a
  // frame where the overlay is still up on the new page.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    if (open) setOpen(false);
  }

  // Menu open: lock the page, trap focus, and close on Escape. Without the
  // trap, tabbing walks into the page behind an opaque overlay.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-base ease-out",
          scrolled || open
            ? "border-b border-faint bg-ink/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-nav max-w-shell items-center justify-between px-gutter">
          <Link
            href="/"
            className="group flex min-h-11 shrink-0 items-center gap-2.5"
            aria-label="WockkingDagger — home"
          >
            <BladeMark className="h-5 w-5 text-blade transition-transform duration-base ease-out group-hover:rotate-[10deg]" />
            <span className="font-display text-base leading-none tracking-[0.02em]">
              WOCKKING<span className="text-blade-text">DAGGER</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "link-draw font-mono text-meta uppercase tracking-button",
                    active && "text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <span className="h-4 w-px bg-[var(--line-strong)]" aria-hidden />

            <div className="flex items-center gap-4">
              {NAV_SOCIALS.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={`${s.label} — opens in a new tab`}
                  className="grid h-11 w-7 place-items-center text-tertiary transition-colors duration-base ease-out hover:text-primary"
                >
                  <SocialIcon platform={s.platform} className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>

            <CartLink count={count} ready={ready} />
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <CartLink count={count} ready={ready} compact />
            <button
              ref={toggleRef}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="flex h-12 w-12 flex-col items-center justify-center gap-[5px]"
            >
              <span
                className={cn(
                  "h-px w-6 bg-bone transition-transform duration-base ease-out",
                  open && "translate-y-[6px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-px w-6 bg-bone transition-opacity duration-fast ease-out",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "h-px w-6 bg-bone transition-transform duration-base ease-out",
                  open && "-translate-y-[6px] -rotate-45"
                )}
              />
            </button>
          </div>
        </div>

      </header>

      {/* Mobile panel — deliberately a sibling of <header>, not a child.
          The header carries backdrop-filter, which would make it the
          containing block for this fixed element and collapse it to the
          header's own height.

          `hidden` when closed so its links are not reachable by keyboard
          and not announced by a screen reader. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-nav z-40 overflow-y-auto bg-ink md:hidden"
      >
        <nav aria-label="Mobile" className="flex flex-col px-gutter pt-6">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-faint py-5 font-display text-[clamp(2.25rem,11vw,3.5rem)] uppercase leading-none tracking-display transition-colors duration-base ease-out hover:text-blade-text"
              style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="border-b border-faint py-5 font-display text-[clamp(2.25rem,11vw,3.5rem)] uppercase leading-none tracking-display transition-colors duration-base ease-out hover:text-blade-text"
          >
            Cart{ready && count > 0 ? ` (${count})` : ""}
          </Link>

          <div className="flex flex-wrap gap-x-6 gap-y-1 py-8">
            {NAV_SOCIALS.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="me noopener noreferrer"
                className="flex min-h-11 items-center gap-2.5 font-mono text-meta uppercase tracking-button text-tertiary"
              >
                <SocialIcon platform={s.platform} className="h-4 w-4" />
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

function CartLink({
  count,
  ready,
  compact,
}: {
  count: number;
  ready: boolean;
  compact?: boolean;
}) {
  // Render the count only after hydration; the server cannot know it and
  // a mismatch would flash the wrong number.
  const label = ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart";
  return (
    <Link
      href="/cart"
      aria-label={label}
      className={cn(
        "relative grid place-items-center text-tertiary transition-colors duration-base ease-out hover:text-primary",
        compact ? "h-12 w-12" : "h-11 w-8"
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <path
          d="M4 7h16l-1.2 12.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8L4 7Zm4 0V5.5a4 4 0 0 1 8 0V7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
        />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -right-1 -top-0.5 grid h-4 min-w-4 place-items-center bg-blade px-1 font-mono text-[10px] leading-none text-bone">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function BladeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" fill="currentColor" />
    </svg>
  );
}
