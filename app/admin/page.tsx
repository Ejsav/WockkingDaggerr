"use client";

import { useEffect, useState } from "react";
import {
  MOCK_POSTS,
  MOCK_PRODUCTS,
  MOCK_DROPS,
} from "@/lib/mock-data";
import { cn, formatPrice, formatRelativeDate } from "@/lib/utils";

const STORAGE_KEY = "wd_admin_gate";

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "posts" | "products" | "drops" | "sync">(
    "overview"
  );

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setAuth(true);
    }
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "dagger";
    if (passcode === expected) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuth(true);
      setError("");
    } else {
      setError("Wrong passcode.");
    }
  }

  if (!auth) {
    return (
      <section className="flex min-h-[100svh] items-center justify-center px-5 pt-32 md:px-10">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <p className="eyebrow-blade mb-5">━━ CONTROL ROOM</p>
          <h1 className="display mb-3 text-5xl md:text-6xl">
            RESTRICTED <br />
            <span className="text-blade">ACCESS.</span>
          </h1>
          <p className="mb-10 text-bone/60">
            This is a demo passcode gate. Replace with Supabase Auth or Clerk before going live.
          </p>

          <label className="eyebrow mb-2 block">PASSCODE</label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            className="w-full border-b border-white/20 bg-transparent py-3 text-lg text-bone placeholder-bone/30 transition-colors focus:border-blade focus:outline-none"
            placeholder="••••••"
          />
          {error && (
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-blade">{error}</p>
          )}

          <button type="submit" className="btn-blade mt-8 w-full">
            ENTER →
          </button>
        </form>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-white/10 pt-32 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 pb-10 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow-blade mb-3">━━ CONTROL ROOM</p>
              <h1 className="display text-4xl md:text-6xl">COMMAND.</h1>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                setAuth(false);
              }}
              className="font-mono text-xs uppercase tracking-widest text-bone/60 hover:text-blade"
            >
              SIGN OUT →
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-[68px] z-30 border-b border-white/10 bg-ink/85 backdrop-blur-md md:top-[76px]">
        <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-5 md:px-10 no-scrollbar">
          {(["overview", "posts", "products", "drops", "sync"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-4 font-mono text-[10px] uppercase tracking-widest transition-colors md:px-5 md:text-xs",
                tab === t
                  ? "border-blade text-bone"
                  : "border-transparent text-bone/50 hover:text-bone"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        {tab === "overview" && <OverviewTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "drops" && <DropsTab />}
        {tab === "sync" && <SyncTab />}
      </section>
    </>
  );
}

function OverviewTab() {
  const [liveData, setLiveData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then(setLiveData)
      .catch(() => {});
  }, []);

  const stats = [
    { label: "POSTS LIVE", value: MOCK_POSTS.filter((p) => p.visible).length },
    { label: "PRODUCTS ACTIVE", value: MOCK_PRODUCTS.filter((p) => p.active).length },
    { label: "DROPS SCHEDULED", value: MOCK_DROPS.length },
    {
      label: "TOTAL INVENTORY",
      value: MOCK_PRODUCTS.reduce((sum, p) => sum + (p.inventory_count ?? 0), 0),
    },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {stats.map((s) => (
          <div key={s.label} className="border border-white/10 bg-ink-700 p-6 md:p-8">
            <p className="eyebrow mb-3">{s.label}</p>
            <p className="font-display text-5xl text-bone md:text-6xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Live stream status */}
      <div className="mt-6 border border-white/10 bg-ink-700 p-6">
        <p className="eyebrow-blade mb-4">LIVE STREAM STATUS</p>
        {!liveData ? (
          <p className="font-mono text-xs uppercase tracking-widest text-bone/40">CHECKING...</p>
        ) : liveData.live ? (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blade animate-pulse_blade" />
              <span className="font-mono text-xs uppercase tracking-widest text-blade">
                LIVE ON {liveData.stream?.platform?.toUpperCase()}
              </span>
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-bone/60">
              {liveData.stream?.viewers?.toLocaleString()} WATCHING
            </span>
            <span className="truncate text-sm text-bone/70">{liveData.stream?.title}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bone/40">OFFLINE</p>
            <div className="flex gap-4">
              {["twitch", "kick"].map((p) => (
                <span key={p} className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
                  {p.toUpperCase()}: {liveData.platforms?.[p]?.configured ? "CONFIGURED" : "NOT SET"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-widest text-bone/40">
        <p>MODE — {process.env.NEXT_PUBLIC_SUPABASE_URL ? "SUPABASE CONNECTED" : "MOCK DATA"}</p>
        <p className="mt-1">LIVE CHECK — POLLS /API/LIVE EVERY 30 SECONDS ON SITE</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function PostsTab() {
  return (
    <div className="space-y-3">
      {MOCK_POSTS.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-4 border border-white/10 bg-ink-700 p-4"
        >
          <span
            className={cn(
              "px-2 py-1 font-mono text-[9px] uppercase tracking-widest",
              p.platform === "youtube" && "bg-blade text-bone",
              p.platform === "tiktok" && "bg-bone text-ink",
              p.platform === "instagram" && "bg-gold text-ink"
            )}
          >
            {p.platform}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-bone">{p.title}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
              {formatRelativeDate(p.posted_at)}
            </p>
          </div>
          <button className="font-mono text-[10px] uppercase tracking-widest text-bone/50 hover:text-blade">
            {p.visible ? "HIDE" : "SHOW"}
          </button>
        </div>
      ))}
      <p className="pt-6 font-mono text-[10px] uppercase tracking-widest text-bone/40">
        ━━ HIDE/SHOW WRITES TO SUPABASE WHEN CREDENTIALS ARE ADDED
      </p>
    </div>
  );
}

// ------------------------------------------------------------
function ProductsTab() {
  return (
    <div className="space-y-3">
      {MOCK_PRODUCTS.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-4 border border-white/10 bg-ink-700 p-4"
        >
          <div className="h-12 w-12 shrink-0 bg-ink-800">
            {p.image_urls?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-bone">{p.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
              {p.category} · {p.inventory_count ?? "∞"} in stock
            </p>
          </div>
          <p className="font-mono text-sm text-bone">
            {formatPrice(p.price_cents, p.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
function DropsTab() {
  return (
    <div className="space-y-3">
      {MOCK_DROPS.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-4 border border-white/10 bg-ink-700 p-4"
        >
          <span
            className={cn(
              "px-2 py-1 font-mono text-[9px] uppercase tracking-widest",
              d.status === "live" && "bg-blade text-bone",
              d.status === "upcoming" && "border border-bone/30 text-bone",
              d.status === "ended" && "bg-ink-500 text-bone/50"
            )}
          >
            {d.status}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-bone">{d.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
              {d.product_ids.length} pieces
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone/50">
            {new Date(d.drops_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
function SyncTab() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function runSync(platform: "youtube" | "tiktok" | "instagram") {
    setLoading(platform);
    try {
      const res = await fetch(`/api/sync/${platform}`, { method: "POST" });
      const json = await res.json();
      setResults((r) => ({ ...r, [platform]: json }));
    } catch (err: any) {
      setResults((r) => ({ ...r, [platform]: { error: err?.message } }));
    } finally {
      setLoading(null);
    }
  }

  const platforms = [
    {
      key: "youtube" as const,
      label: "YOUTUBE",
      channels: ["@wockkingdaggerr", "@wockkingdaggerlive"],
      note: "Syncs both channels in one pass",
    },
    {
      key: "tiktok" as const,
      label: "TIKTOK",
      channels: ["@wockkingdaggerr"],
      note: "Requires Developer Portal approval",
    },
    {
      key: "instagram" as const,
      label: "INSTAGRAM",
      channels: ["@wockkingdaggerr"],
      note: "Requires Graph API long-lived token",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-bone/60">
        Manually trigger a sync to pull the latest posts from each platform. In production,
        schedule these from Vercel Cron every 1 to 6 hours.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {platforms.map((p) => {
          const res = results[p.key];
          const isOk = res?.ok;
          const isConfigured = res?.configured !== false;
          return (
            <div key={p.key} className="border border-white/10 bg-ink-700 p-6">
              <p className="eyebrow-blade mb-1">{p.label}</p>
              <div className="mb-4 space-y-1">
                {p.channels.map((c) => (
                  <p key={c} className="font-mono text-[10px] uppercase tracking-widest text-bone/50">
                    {c}
                  </p>
                ))}
                <p className="font-mono text-[10px] tracking-widest text-bone/30">{p.note}</p>
              </div>

              <button
                onClick={() => runSync(p.key)}
                disabled={loading === p.key}
                className="btn-blade w-full"
              >
                {loading === p.key ? "SYNCING..." : "RUN SYNC"}
              </button>

              {res && (
                <div className="mt-4 space-y-2">
                  <p className={cn(
                    "font-mono text-[10px] uppercase tracking-widest",
                    isOk ? "text-bone" : "text-blade"
                  )}>
                    {!isConfigured
                      ? "NOT CONFIGURED"
                      : isOk
                      ? `SYNCED ${res.synced ?? 0} POSTS · ${res.channels_synced ?? 1} CHANNEL${(res.channels_synced ?? 1) > 1 ? "S" : ""}`
                      : `ERROR — CHECK CONSOLE`}
                  </p>
                  {res.preview && (
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      {res.preview.slice(0, 3).map((v: any, i: number) => (
                        <p key={i} className="truncate font-mono text-[9px] text-bone/50">
                          {v.title}
                        </p>
                      ))}
                    </div>
                  )}
                  {res.errors && (
                    <p className="font-mono text-[9px] text-blade/80">{res.errors}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border border-white/10 bg-ink-800 p-5">
        <p className="eyebrow mb-3">WHAT TO SET IN .ENV.LOCAL</p>
        <pre className="font-mono text-[10px] leading-6 text-bone/60">{`YOUTUBE_API_KEY=your_google_api_key
YOUTUBE_UPLOADS_PLAYLIST_ID=UUYEdpldm-qXYaT2xae1_ndQ   # @wockkingdaggerr
YOUTUBE_UPLOADS_PLAYLIST_ID_2=UU[live channel id]        # @wockkingdaggerlive`}</pre>
      </div>
    </div>
  );
}
