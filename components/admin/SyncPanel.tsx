"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "@/lib/utils";

// ============================================================
// SYNC
//
// The button calls the same authenticated endpoint Vercel Cron
// calls. It works here because the browser carries the admin
// session cookie; without it the endpoint answers 401.
// ============================================================

interface Run {
  id: string;
  source: string;
  ok: boolean;
  items: number;
  duration_ms: number;
  error: string | null;
  ran_at: string;
}

const SOURCES = ["all", "youtube", "twitch", "tiktok", "instagram", "live"] as const;

interface Outcome {
  ok: boolean;
  summary: string;
}

export default function SyncPanel({ runs }: { runs: Run[] }) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});

  async function run(source: string) {
    setRunning(source);
    try {
      const res = await fetch(`/api/sync/${source}`, { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        skipped?: boolean;
        results?: Array<{ source: string; ok: boolean; skipped: boolean; items: number; error: string | null }>;
      };

      if (!res.ok) {
        setOutcomes((o) => ({
          ...o,
          [source]: { ok: false, summary: json.error ?? `HTTP ${res.status}` },
        }));
        return;
      }

      const summary = json.results
        ? json.results
            .map((r) =>
              r.skipped
                ? `${r.source}: not configured`
                : `${r.source}: ${r.items} item${r.items === 1 ? "" : "s"}${r.error ? " (with errors)" : ""}`
            )
            .join(" · ")
        : json.skipped
          ? "Not configured"
          : "Done";

      setOutcomes((o) => ({ ...o, [source]: { ok: json.ok !== false, summary } }));
      router.refresh();
    } catch {
      setOutcomes((o) => ({ ...o, [source]: { ok: false, summary: "Network problem" } }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="prose-body mb-6">
          Sync runs automatically on the schedule in <code className="font-mono text-xs text-primary">vercel.json</code>.
          These buttons trigger the same authenticated endpoints by hand.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map((source) => {
            const outcome = outcomes[source];
            return (
              <div key={source} className="border border-faint bg-surface-1 p-5">
                <p className="eyebrow-accent mb-4">{source}</p>
                <button
                  type="button"
                  onClick={() => run(source)}
                  disabled={running !== null}
                  className="btn btn-secondary w-full"
                >
                  <span>{running === source ? "Running…" : "Run sync"}</span>
                </button>
                {outcome && (
                  <p
                    role="status"
                    className={`mt-3 font-mono text-[10px] uppercase tracking-button ${
                      outcome.ok ? "text-tertiary" : "text-blade-text"
                    }`}
                  >
                    {outcome.summary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-4">Recent runs</h3>
        {runs.length > 0 ? (
          <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                <span
                  className={`w-16 shrink-0 font-mono text-[10px] uppercase tracking-button ${
                    r.ok ? "text-tertiary" : "text-blade-text"
                  }`}
                >
                  {r.ok ? "ok" : "failed"}
                </span>
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-button">
                  {r.source}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-tertiary">
                  {r.items} items · {r.duration_ms}ms
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-button text-tertiary">
                  {formatRelativeDate(r.ran_at)}
                </span>
                {r.error && (
                  <span className="w-full font-mono text-[10px] text-blade-text">{r.error}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">No sync has run yet.</p>
        )}
      </div>
    </div>
  );
}
