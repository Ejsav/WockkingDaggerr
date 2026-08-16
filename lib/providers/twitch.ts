import { WD } from "@/lib/wockkingdagger";
import type { MediaItem } from "@/lib/media";

// ============================================================
// TWITCH PROVIDER
// Uses the Twitch Helix API with app access tokens (no user
// authorization required). Reads TWITCH_CLIENT_ID and
// TWITCH_CLIENT_SECRET from env — both stay server-side.
//
// Exposes:
//   getTwitchLiveStatus()  — polling-friendly live check
//   getTwitchVods()        — ALL public VODs (cursor-paginated)
//   getTwitchUserId()      — resolves login → user ID
// ============================================================

// ------------------------------------------------------------
// TOKEN CACHE — globalThis survives Next.js hot-reloads
// ------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __twitchToken: { token: string; expiresAt: number } | null;
  // eslint-disable-next-line no-var
  var __twitchUserId: string | null;
}

globalThis.__twitchToken = globalThis.__twitchToken ?? null;
globalThis.__twitchUserId = globalThis.__twitchUserId ?? null;

async function getAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (globalThis.__twitchToken && Date.now() < globalThis.__twitchToken.expiresAt) {
    return globalThis.__twitchToken.token;
  }

  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    globalThis.__twitchToken = {
      token: json.access_token,
      expiresAt: Date.now() + (json.expires_in - 300) * 1000,
    };
    return json.access_token;
  } catch {
    return null;
  }
}

function twitchHeaders(token: string): Record<string, string> {
  return {
    "Client-Id": process.env.TWITCH_CLIENT_ID!,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Resolve channel login → numeric user ID (cached per process)
async function getUserId(token: string, login: string): Promise<string | null> {
  if (globalThis.__twitchUserId) return globalThis.__twitchUserId;
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
      { headers: twitchHeaders(token), next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const userId = json.data?.[0]?.id ?? null;
    if (userId) globalThis.__twitchUserId = userId;
    return userId;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// LIVE STATUS
// ------------------------------------------------------------
export interface TwitchLiveStatus {
  isLive: boolean;
  configured: boolean;
  channelLogin: string;
  title: string | null;
  game: string | null;
  viewerCount: number | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
  streamId: string | null;
  error: string | null;
}

export async function getTwitchLiveStatus(): Promise<TwitchLiveStatus> {
  const channelLogin = WD.twitch.channelLogin;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  const base: TwitchLiveStatus = {
    isLive: false,
    configured: !!(clientId && clientSecret),
    channelLogin,
    title: null,
    game: null,
    viewerCount: null,
    thumbnailUrl: null,
    startedAt: null,
    streamId: null,
    error: null,
  };

  if (!clientId || !clientSecret) {
    return { ...base, error: "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET" };
  }

  const token = await getAppToken();
  if (!token) return { ...base, error: "Failed to get Twitch app token" };

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channelLogin)}`,
      { headers: twitchHeaders(token), next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return { ...base, error: `Twitch API ${res.status}` };
    }

    const json = await res.json();
    const stream = json.data?.[0];

    if (!stream) return base; // Offline

    return {
      isLive: true,
      configured: true,
      channelLogin,
      title: stream.title ?? "Live Now",
      game: stream.game_name ?? null,
      viewerCount: typeof stream.viewer_count === "number" ? stream.viewer_count : null,
      thumbnailUrl: stream.thumbnail_url
        ? stream.thumbnail_url.replace("{width}", "1280").replace("{height}", "720")
        : null,
      startedAt: stream.started_at ?? null,
      streamId: stream.id ?? null,
      error: null,
    };
  } catch (err: any) {
    return { ...base, error: err?.message ?? "Unknown error" };
  }
}

// ------------------------------------------------------------
// VODs — ALL public VODs via cursor-based pagination
// Twitch caps each page at 100. We paginate until exhausted
// or until the hard cap (MAX_VODS) is hit.
// ------------------------------------------------------------
export interface TwitchVodResult {
  items: MediaItem[];
  configured: boolean;
  error: string | null;
}

const MAX_VODS = 500; // Safety cap — well beyond typical channel size

function parseTwitchDuration(dur: string): number | null {
  if (!dur) return null;
  // Format: "1h2m3s" or "42m10s" or "1s"
  const match = dur.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return null;
  return (parseInt(match[1] ?? "0") * 3600) +
    (parseInt(match[2] ?? "0") * 60) +
    parseInt(match[3] ?? "0");
}

export async function getTwitchVods(limit = MAX_VODS): Promise<TwitchVodResult> {
  const channelLogin = WD.twitch.channelLogin;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      items: [],
      configured: false,
      error: "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET",
    };
  }

  const token = await getAppToken();
  if (!token) return { items: [], configured: true, error: "Token fetch failed" };

  const userId = await getUserId(token, channelLogin);
  if (!userId) return { items: [], configured: true, error: "Could not resolve Twitch user ID" };

  try {
    const allVods: any[] = [];
    let cursor: string | undefined;
    const cap = Math.min(limit, MAX_VODS);

    // Paginate until exhausted or cap hit
    do {
      const url = new URL("https://api.twitch.tv/helix/videos");
      url.searchParams.set("user_id", userId);
      url.searchParams.set("type", "archive");
      url.searchParams.set("first", "100"); // max per page Twitch allows
      if (cursor) url.searchParams.set("after", cursor);

      const res = await fetch(url.toString(), {
        headers: twitchHeaders(token),
        next: { revalidate: 300 }, // cache 5 min
      });

      if (!res.ok) {
        // Partial result is fine — return what we have
        break;
      }

      const json = await res.json();
      const page: any[] = json.data ?? [];
      allVods.push(...page);
      cursor = json.pagination?.cursor ?? undefined;

      // Stop if Twitch signals no more pages or we hit the cap
    } while (cursor && allVods.length < cap);

    const items: MediaItem[] = allVods.map((v) => ({
      id: `twitch_${v.id}`,
      source: "twitch" as const,
      type: "vod" as const,
      title: v.title ?? "Untitled VOD",
      description: v.description ?? null,
      thumbnail: v.thumbnail_url
        ? v.thumbnail_url
            .replace("%{width}", "640")
            .replace("%{height}", "360")
            .replace("{width}", "640")
            .replace("{height}", "360")
        : null,
      publishedAt: v.published_at ?? v.created_at ?? null,
      duration: parseTwitchDuration(v.duration ?? ""),
      viewCount: typeof v.view_count === "number" ? v.view_count : null,
      url: v.url ?? `https://twitch.tv/videos/${v.id}`,
      embedUrl: `https://player.twitch.tv/?video=${v.id}`,
      platformLabel: "Twitch" as const,
      externalId: v.id,
    }));

    return { items, configured: true, error: null };
  } catch (err: any) {
    return { items: [], configured: true, error: err?.message ?? "Unknown error" };
  }
}
