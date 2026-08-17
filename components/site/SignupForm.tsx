"use client";

import { useId, useState } from "react";
import { track } from "@/lib/analytics";

// ============================================================
// EMAIL / SMS CAPTURE
// Real submission to /api/subscribe, real validation feedback,
// real consent handling. The honeypot field is hidden from
// sighted users and from assistive technology alike.
// ============================================================

type Status = "idle" | "loading" | "ok" | "error";

export default function SignupForm({ source = "footer" }: { source?: string }) {
  const emailId = useId();
  const phoneId = useId();
  const consentId = useId();
  const statusId = useId();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");
    track("signup_submitted", { source });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          sms_consent: smsConsent,
          email_consent: true,
          source,
          website,
        }),
      });
      const json = (await res.json()) as { error?: string; already?: boolean };

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong. Try again.");
        track("signup_failed", { source, status: res.status });
        return;
      }

      setStatus("ok");
      setMessage(
        json.already ? "You were already on the list. Nothing to do." : "You're on the list."
      );
      setEmail("");
      setPhone("");
      setSmsConsent(false);
      track("signup_succeeded", { source });
    } catch {
      setStatus("error");
      setMessage("Network problem. Try again.");
      track("signup_failed", { source, status: 0 });
    }
  }

  if (status === "ok") {
    return (
      <div data-reveal="" className="flex flex-col gap-4">
        <span
          aria-hidden
          className="grid h-12 w-12 place-items-center border border-[var(--blade)]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blade-text">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="square"
            />
          </svg>
        </span>
        <p className="font-display text-section uppercase">You&rsquo;re in.</p>
        <p role="status" className="meta">
          {message}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="link-draw self-start font-mono text-meta uppercase tracking-button"
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <label htmlFor={emailId} className="eyebrow mb-2 block">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="field"
          aria-describedby={statusId}
        />
      </div>

      <div>
        <label htmlFor={phoneId} className="eyebrow mb-2 block">
          Phone <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id={phoneId}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="field"
          aria-describedby={statusId}
        />
      </div>

      {phone.trim().length > 0 && (
        <div className="flex items-start gap-3">
          <input
            id={consentId}
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--blade)]"
          />
          <label htmlFor={consentId} className="text-sm leading-snug text-[var(--text-secondary)]">
            Text me about drops. Message and data rates may apply. Reply STOP to opt out.
          </label>
        </div>
      )}

      {/* Honeypot: off-screen, not announced, never focusable. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="wd-website">Website</label>
        <input
          id="wd-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button type="submit" disabled={status === "loading"} className="btn btn-primary self-start">
        <span>{status === "loading" ? "Signing up…" : "Get first access"}</span>
      </button>

      <p
        id={statusId}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={
          status === "error"
            ? "font-mono text-meta uppercase tracking-button text-blade-text"
            : "meta"
        }
      >
        {message || "Drops and releases. No spam. Unsubscribe any time."}
      </p>
    </form>
  );
}
