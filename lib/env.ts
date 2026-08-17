// ============================================================
// ENVIRONMENT CONTRACT
// Every variable the application reads is declared here, once.
// Nothing else in the codebase touches process.env directly
// except next.config.js and this file's own accessors.
//
// RULES
//   - Anything named NEXT_PUBLIC_* is inlined into the browser
//     bundle at build time. Only non-secret values may use it.
//   - Everything else is server-only. Importing this module from
//     a client component is safe: the secret accessors throw if
//     called outside a server runtime.
// ============================================================

const isServer = typeof window === "undefined";

function serverOnly(name: string, value: string | undefined): string | undefined {
  if (!isServer) {
    throw new Error(
      `${name} is a server-only environment variable and was read from the browser.`
    );
  }
  return value && value.length > 0 ? value : undefined;
}

// ------------------------------------------------------------
// PUBLIC — safe to ship to the browser
// ------------------------------------------------------------

/** Canonical origin, no trailing slash. Drives metadata, canonicals, sitemap, Stripe redirects. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).hostname;
  } catch {
    return "localhost";
  }
})();

/** Domains permitted to embed the Twitch player. Twitch rejects embeds from unlisted parents. */
export const TWITCH_PARENTS: string[] = Array.from(
  new Set([SITE_HOST, "localhost"].filter(Boolean))
);

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || `support@${SITE_HOST}`;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** True when the durable store is reachable. Every data read depends on this. */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// ------------------------------------------------------------
// SERVER-ONLY — never referenced from a client component
// ------------------------------------------------------------

export const serverEnv = {
  get supabaseServiceKey() {
    return serverOnly("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get stripeSecretKey() {
    return serverOnly("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get stripeWebhookSecret() {
    return serverOnly("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
  get adminPassword() {
    return serverOnly("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD);
  },
  get adminSessionSecret() {
    return serverOnly("ADMIN_SESSION_SECRET", process.env.ADMIN_SESSION_SECRET);
  },
  get cronSecret() {
    return serverOnly("CRON_SECRET", process.env.CRON_SECRET);
  },
  get youtubeApiKey() {
    return serverOnly("YOUTUBE_API_KEY", process.env.YOUTUBE_API_KEY);
  },
  get youtubePlaylists(): string[] {
    const primary = serverOnly("YOUTUBE_UPLOADS_PLAYLIST_ID", process.env.YOUTUBE_UPLOADS_PLAYLIST_ID);
    const secondary = serverOnly("YOUTUBE_UPLOADS_PLAYLIST_ID_2", process.env.YOUTUBE_UPLOADS_PLAYLIST_ID_2);
    return [primary, secondary].filter((v): v is string => Boolean(v));
  },
  get twitchClientId() {
    return serverOnly("TWITCH_CLIENT_ID", process.env.TWITCH_CLIENT_ID);
  },
  get twitchClientSecret() {
    return serverOnly("TWITCH_CLIENT_SECRET", process.env.TWITCH_CLIENT_SECRET);
  },
  get twitchChannelLogin() {
    return serverOnly("TWITCH_CHANNEL_LOGIN", process.env.TWITCH_CHANNEL_LOGIN) ?? "wockkingdaggerr";
  },
  get tiktokAccessToken() {
    return serverOnly("TIKTOK_ACCESS_TOKEN", process.env.TIKTOK_ACCESS_TOKEN);
  },
  get instagramUserId() {
    return serverOnly("INSTAGRAM_USER_ID", process.env.INSTAGRAM_USER_ID);
  },
  get instagramAccessToken() {
    return serverOnly("INSTAGRAM_ACCESS_TOKEN", process.env.INSTAGRAM_ACCESS_TOKEN);
  },
} as const;

/** Service-role writes require both the project URL and the service key. */
export function hasServiceRole(): boolean {
  return Boolean(SUPABASE_URL && serverEnv.supabaseServiceKey);
}

/** Admin sign-in is only possible when both the password and the signing secret exist. */
export function adminAuthConfigured(): boolean {
  return Boolean(serverEnv.adminPassword && serverEnv.adminSessionSecret);
}

export function stripeConfigured(): boolean {
  return Boolean(serverEnv.stripeSecretKey);
}
