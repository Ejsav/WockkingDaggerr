"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordId = useId();
  const errorId = useId();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next: searchParams.get("next") ?? undefined }),
      });
      const json = (await res.json()) as { redirect?: string; error?: string };

      if (!res.ok) {
        setError(json.error ?? "Sign-in failed.");
        setBusy(false);
        return;
      }

      // The session cookie is set by the response; a refresh makes the
      // server re-run middleware with it attached.
      router.replace(json.redirect ?? "/admin");
      router.refresh();
    } catch {
      setError("Network problem. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10">
      <label htmlFor={passwordId} className="eyebrow mb-2 block">
        Passcode
      </label>
      <input
        id={passwordId}
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="field"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
      />

      <p id={errorId} role="alert" className="mt-3 min-h-5">
        {error && (
          <span className="font-mono text-[11px] uppercase tracking-button text-blade-text">
            {error}
          </span>
        )}
      </p>

      <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
        <span>{busy ? "Checking…" : "Enter"}</span>
      </button>
    </form>
  );
}
