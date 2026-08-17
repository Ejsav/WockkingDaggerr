// ============================================================
// FORMATTING + SMALL PURE HELPERS
// Everything here is deterministic and unit-tested. Anything
// that reads the clock takes `now` so tests are not flaky.
// ============================================================

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRelativeDate(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((now - then) / 86_400_000);
  if (days < 0) return formatDate(iso);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Seconds to a clock string. Hours are shown when present —
 * a three-hour Twitch VOD reads "3:04:11", not "184:11".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** ISO 8601 duration (YouTube `contentDetails.duration`) to seconds. */
export function parseIsoDuration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match || match.slice(1).every((g) => g === undefined)) return null;
  const [, d, h, m, s] = match;
  return (
    Number(d ?? 0) * 86_400 +
    Number(h ?? 0) * 3600 +
    Number(m ?? 0) * 60 +
    Number(s ?? 0)
  );
}

/** Twitch duration strings ("1h2m3s", "42m10s", "31s") to seconds. */
export function parseTwitchDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || match.slice(1).every((g) => g === undefined)) return null;
  const [, h, m, s] = match;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  if (n < 1000) return String(Math.round(n));
  if (n < 10_000) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${Math.round(n / 1_000_000)}M`;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  done: boolean;
}

export function getCountdown(targetIso: string, now: number = Date.now()): Countdown {
  const target = new Date(targetIso).getTime();
  const diff = Number.isNaN(target) ? 0 : target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, done: true };
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    totalMs: diff,
    done: false,
  };
}

/** Human label for a variant size. ONE_SIZE is an implementation detail. */
export function formatSize(size: string): string {
  return size === "ONE_SIZE" ? "One size" : size;
}

/** Canonical absolute URL for a path. Always used for <link rel="canonical">. */
export function absoluteUrl(base: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${clean === "/" ? "" : clean}`;
}
