import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { parseTwitchDuration } from "@/lib/utils";
import type { LiveStatus, MediaItem } from "@/types";
import { failed, skipped, type ProviderResult } from "@/lib/providers/types";

// ============================================================
// TWITCH — Helix, app access token (no user authorization)
//
// Both entry points run from cron only:
//   fetchTwitchVods()      cursor-paginated archive
//   fetchTwitchLiveStatus() single stream check
//
// The token and user-id caches below are pure optimizations. If
// the process is recycled they are simply refetched — no feature
// depends on them surviving.
// ============================================================

const HELIX = "https://api.twitch.tv/helix";
const MAX_VODS = 500;

let tokenCache: { token: string; expiresAt: number } | null = null;
let userIdCache: { login: string; id: string } | null = null;

async function appToken(): Promise<string | null> {
  const clientId = serverEnv.twitchClientId;
  const clientSecret = serverEnv.twitchClientSecret;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  try {
    const res = await fetchWithTimeout(url.toString(), { method: "POST", timeoutMs: 8000 });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    tokenCache = {
      token: json.access_token,
      expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 3600) - 300) * 1000,
    };
    return json.access_token;
  } catch {
    return null;
  }
}

function headers(token: string): Record<string, string> {
  return {
    "Client-Id": serverEnv.twitchClientId ?? "",
    Authorization: `Bearer ${token}`,
  };
}

async function resolveUserId(token: string, login: string): Promise<string | null> {
  if (userIdCache?.login === login) return userIdCache.id;
  try {
    const res = await fetchWithTimeout(
      `${HELIX}/users?login=${encodeURIComponent(login)}`,
      { headers: headers(token), timeoutMs: 8000 }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ id?: string }> };
    const id = json.data?.[0]?.id ?? null;
    if (id) userIdCache = { login, id };
    return id;
  } catch {
    return null;
  }
}

function sizedThumbnail(url: string | undefined): string | null {
  if (!url) return null;
  return url
    .replace("%{width}", "640")
    .replace("%{height}", "360")
    .replace("{width}", "640")
    .replace("{height}", "360");
}

// ------------------------------------------------------------
// VODs
// ------------------------------------------------------------

export async function fetchTwitchVods(limit = MAX_VODS): Promise<ProviderResult> {
  if (!serverEnv.twitchClientId || !serverEnv.twitchClientSecret) {
    return skipped("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not set");
  }

  const token = await appToken();
  if (!token) return failed("Twitch app token request failed");

  const login = serverEnv.twitchChannelLogin;
  const userId = await resolveUserId(token, login);
  if (!userId) return failed(`Could not resolve Twitch user "${login}"`);

  const raw: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;
  const cap = Math.min(limit, MAX_VODS);
  let error: string | null = null;

  do {
    const url = new URL(`${HELIX}/videos`);
    url.searchParams.set("user_id", userId);
    url.searchParams.set("type", "archive");
    url.searchParams.set("first", "100");
    if (cursor) url.searchParams.set("after", cursor);

    let res: Response;
    try {
      res = await fetchWithTimeout(url.toString(), { headers: headers(token), timeoutMs: 8000 });
    } catch (err) {
      error = `twitch videos: ${(err as Error).message}`;
      break;
    }
    if (!res.ok) {
      error = `twitch videos: HTTP ${res.status}`;
      break;
    }

    const json = (await res.json()) as {
      data?: Array<Record<string, unknown>>;
      pagination?: { cursor?: string };
    };
    raw.push(...(json.data ?? []));
    cursor = json.pagination?.cursor;
  } while (cursor && raw.length < cap);

  const items: MediaItem[] = raw.map((v) => {
    const id = String(v.id);
    const views = typeof v.view_count === "number" ? v.view_count : null;
    return {
      id: `twitch:${id}`,
      source: "twitch" as const,
      kind: "vod" as const,
      external_id: id,
      title: (v.title as string) || "Untitled VOD",
      description: ((v.description as string) || "").trim() || null,
      thumbnail_url: sizedThumbnail(v.thumbnail_url as string | undefined),
      permalink: (v.url as string) ?? `https://www.twitch.tv/videos/${id}`,
      embed_url: null, // built at render time — the player needs a `parent` per host
      published_at: (v.published_at as string) ?? (v.created_at as string) ?? null,
      duration_seconds: parseTwitchDuration(v.duration as string),
      view_count: views,
      visible: true,
      synced_at: new Date().toISOString(),
    };
  });

  // A partial page plus an error is still useful; nothing plus an error is a failure.
  if (items.length === 0 && error) return failed(error);
  return { items, configured: true, error };
}

// ------------------------------------------------------------
// LIVE STATUS
// ------------------------------------------------------------

export interface LiveProbe {
  status: Omit<LiveStatus, "checked_at"> | null;
  configured: boolean;
  error: string | null;
}

export async function fetchTwitchLiveStatus(): Promise<LiveProbe> {
  const login = serverEnv.twitchChannelLogin;

  if (!serverEnv.twitchClientId || !serverEnv.twitchClientSecret) {
    return { status: null, configured: false, error: "Twitch credentials not set" };
  }

  const token = await appToken();
  if (!token) return { status: null, configured: true, error: "Twitch app token request failed" };

  try {
    const res = await fetchWithTimeout(
      `${HELIX}/streams?user_login=${encodeURIComponent(login)}`,
      { headers: headers(token), timeoutMs: 6000, retries: 1 }
    );
    if (!res.ok) {
      return { status: null, configured: true, error: `twitch streams: HTTP ${res.status}` };
    }

    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const stream = json.data?.[0];

    if (!stream) {
      return {
        status: {
          is_live: false,
          platform: "twitch",
          channel: login,
          title: null,
          game: null,
          viewer_count: null,
          started_at: null,
        },
        configured: true,
        error: null,
      };
    }

    return {
      status: {
        is_live: true,
        platform: "twitch",
        channel: login,
        title: (stream.title as string) ?? null,
        game: (stream.game_name as string) ?? null,
        viewer_count:
          typeof stream.viewer_count === "number" ? stream.viewer_count : null,
        started_at: (stream.started_at as string) ?? null,
      },
      configured: true,
      error: null,
    };
  } catch (err) {
    return { status: null, configured: true, error: (err as Error).message };
  }
}
