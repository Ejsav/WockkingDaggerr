"use client";

import Link from "next/link";
import { useState } from "react";
import { FOOTER_SOCIALS } from "@/lib/socials";
import { SocialIcon } from "@/components/Navigation";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || null,
          phone: phone || null,
          sms_consent: smsConsent,
          email_consent: true,
          source: "footer",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Subscribe failed");
      setStatus("ok");
      setMessage("You're on the list. Watch the inbox.");
      setEmail("");
      setPhone("");
      setSmsConsent(false);
    } catch (err: any) {
      setStatus("err");
      setMessage(err?.message ?? "Something went wrong.");
    }
  }

  return (
    <footer className="relative z-[2] mt-32 border-t border-white/10 bg-ink">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">

        {/* Social platforms strip */}
        <div className="mb-16 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-white/10 pb-10">
          <p className="eyebrow mr-4">FIND US</p>
          {FOOTER_SOCIALS.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 transition-colors hover:text-blade"
            >
              <SocialIcon platform={s.label} className="h-4 w-4 text-bone/50 transition-colors group-hover:text-blade" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone/50 transition-colors group-hover:text-blade">
                {s.handle}
              </span>
            </a>
          ))}
        </div>

        {/* Email capture */}
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="eyebrow-blade mb-6">FIRST ACCESS</p>
            <h2 className="display mb-6 text-4xl md:text-6xl">
              SIGN UP. <br />
              KNOW BEFORE <br />
              THE REST.
            </h2>
            <p className="max-w-md text-bone/60">
              Drops, releases, behind-the-scenes. No spam, no nonsense. Leave when you want.
            </p>
          </div>

          <div className="md:col-span-6">
            {status === "ok" ? (
              // Success state
              <div className="flex h-full flex-col justify-center gap-4" style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
                <div className="inline-flex h-12 w-12 items-center justify-center border border-blade">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blade">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-display text-3xl uppercase text-bone">YOU'RE IN.</h3>
                <p className="font-mono text-xs uppercase tracking-widest text-bone/60">{message}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="font-mono text-[10px] uppercase tracking-widest text-bone/40 hover:text-blade transition-colors"
                >
                  ← SIGN UP ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="eyebrow mb-2 block">EMAIL</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@somewhere.com"
                    className="w-full border-b border-white/20 bg-transparent py-3 text-lg text-bone placeholder-bone/30 transition-colors focus:border-blade focus:outline-none"
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block">PHONE (OPTIONAL)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 555-5555"
                    className="w-full border-b border-white/20 bg-transparent py-3 text-lg text-bone placeholder-bone/30 transition-colors focus:border-blade focus:outline-none"
                  />
                </div>
                {phone && (
                  <label className="flex items-start gap-3 text-xs text-bone/60">
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-1 h-3 w-3 accent-blade"
                    />
                    <span>
                      I agree to receive recurring marketing SMS from WockkingDagger. Message and data
                      rates may apply. Reply STOP to unsubscribe, HELP for help.
                    </span>
                  </label>
                )}
                <button type="submit" disabled={status === "loading"} className="btn-blade w-full md:w-auto">
                  {status === "loading" ? "JOINING..." : "JOIN THE LIST"}
                </button>
                {status === "err" && message && (
                  <p className="font-mono text-xs uppercase tracking-widest text-blade">{message}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-24 flex flex-col gap-8 border-t border-white/10 pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="display text-6xl text-bone md:text-8xl">
              WOCKKING<span className="text-blade">DAGGER</span>
            </p>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-bone/40">
              © {new Date().getFullYear()} — All rights reserved
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 font-mono text-xs uppercase tracking-widest md:grid-cols-3">
            <Link href="/watch" className="text-bone/60 hover:text-bone transition-colors">Watch</Link>
            <Link href="/shop" className="text-bone/60 hover:text-bone transition-colors">Shop</Link>
            <Link href="/drops" className="text-bone/60 hover:text-bone transition-colors">Drops</Link>
            <a href="#" className="text-bone/60 hover:text-bone transition-colors">Privacy</a>
            <a href="#" className="text-bone/60 hover:text-bone transition-colors">Terms</a>
            <a href="#" className="text-bone/60 hover:text-bone transition-colors">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
