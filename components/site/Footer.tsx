import Link from "next/link";
import { SOCIAL_LINKS, WD } from "@/lib/wockkingdagger";
import { CONTACT_EMAIL } from "@/lib/env";
import SocialIcon from "@/components/site/SocialIcon";
import SignupForm from "@/components/site/SignupForm";
import { Reveal } from "@/components/motion/Reveal";

const LEGAL = [
  { label: "Shipping & returns", href: "/legal/shipping-returns" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
];

export default function Footer() {
  return (
    <footer className="relative z-[2] border-t border-[var(--line)] bg-ink">
      {/* Signup is the last thing on every page — the one conversion
          surface that follows the visitor everywhere. */}
      <section className="border-b border-faint">
        <div className="mx-auto grid max-w-shell gap-12 px-gutter py-section md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-6">
            <p className="eyebrow-accent mb-5">First access</p>
            <h2 className="display text-section">
              Know before
              <br />
              the rest.
            </h2>
            <p className="prose-body mt-6">
              Drops sell through. The list gets the timestamp before the timer starts.
            </p>
          </Reveal>
          <div className="md:col-span-5 md:col-start-8">
            <SignupForm source="footer" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-shell px-gutter py-section-tight">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-card uppercase tracking-display">
              WOCKKING<span className="text-blade-text">DAGGER</span>
            </p>
            <p className="prose-body mt-3 max-w-sm text-sm">{WD.tagline}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="link-draw mt-3 inline-flex min-h-11 items-center font-mono text-meta lowercase tracking-normal"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <nav aria-label="Social profiles" className="md:col-span-4">
            <p className="eyebrow mb-4">Find us</p>
            <ul className="grid grid-cols-2 gap-x-6">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="flex min-h-11 items-center gap-2.5 font-mono text-meta uppercase tracking-button text-tertiary transition-colors duration-base ease-out hover:text-primary"
                  >
                    <SocialIcon platform={s.platform} className="h-3.5 w-3.5" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="md:col-span-3">
            <p className="eyebrow mb-4">Legal</p>
            <ul>
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-11 items-center font-mono text-meta uppercase tracking-button text-tertiary transition-colors duration-base ease-out hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <hr className="rule my-8" />

        <p className="meta">
          © {new Date().getUTCFullYear()} {WD.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
