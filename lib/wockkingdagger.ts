// ============================================================
// WOCKKINGDAGGER — CREATOR CONFIG
// Single source of truth for all creator identities, handles,
// channel IDs, embed domains, and brand copy.
//
// IMPORTANT USERNAME RULES:
//   Twitch:    wockkingdaggerr   (two r's)
//   TikTok:    @wockkingdaggerr  (two r's)
//   Instagram: @wockkingdaggerr  (two r's)
//   YouTube:   @wockkingdaggerr  (main, two r's)
//              @wockkingdaggerlive (secondary live channel)
//
// DO NOT scatter handles across other files.
// All components, providers, and routes import from here.
// ============================================================

// ------------------------------------------------------------
// CORE IDENTITY
// ------------------------------------------------------------
export const WD = {
  displayName: "WockkingDagger",
  handle: "wockkingdagger",
  tagline: "Streamer. Creator. Builder.",
  bio: "Started with a camera and an internet connection. Built a following on raw content — no algorithm tricks, no manufactured moments. The channel is the record. The drops are the proof.",
  location: "Online",

  // Brand copy
  copy: {
    siteTitle: "WockkingDagger — Official Hub",
    siteDescription:
      "The official hub for WockkingDagger. Releases, drops, video archive, store, and live streams. Built for the ones paying attention.",
    watchPageTitle: "The Archive",
    watchPageDesc: "Every video, VOD, and stream. Auto-synced from YouTube and Twitch. Nothing gets cut.",
  },

  // ------------------------------------------------------------
  // YOUTUBE — two channels, IDs always read from env for flexibility
  // Main:  @wockkingdaggerr
  // Live:  @wockkingdaggerlive
  // ------------------------------------------------------------
  youtube: {
    channelIdMain: process.env.YOUTUBE_CHANNEL_ID_MAIN ?? "UCYEdpldm-qXYaT2xae1_ndQ",
    channelIdLive: process.env.YOUTUBE_CHANNEL_ID_LIVE ?? "UCFa90RcysqjyYzTTrK6F3IQ",
    handleMain: "@wockkingdaggerr",
    handleLive: "@wockkingdaggerlive",
    urlMain: "https://youtube.com/@wockkingdaggerr",
    urlLive: "https://youtube.com/@wockkingdaggerlive",
    // Uploads playlist: replace leading UC with UU
    uploadsPlaylistMain:
      process.env.YOUTUBE_UPLOADS_PLAYLIST_ID ??
      ("UCYEdpldm-qXYaT2xae1_ndQ".replace(/^UC/, "UU")),
    uploadsPlaylistLive:
      process.env.YOUTUBE_UPLOADS_PLAYLIST_ID_2 ??
      ("UCFa90RcysqjyYzTTrK6F3IQ".replace(/^UC/, "UU")),
  },

  // ------------------------------------------------------------
  // TWITCH — username: wockkingdaggerr (two r's)
  // Server-side env vars only for credentials.
  // ------------------------------------------------------------
  twitch: {
    channelLogin: process.env.TWITCH_CHANNEL_LOGIN ?? "wockkingdaggerr",
    url: "https://twitch.tv/wockkingdaggerr",
    // Public embed parent domains — must match actual deployment
    embedParents: (() => {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      try {
        const host = new URL(siteUrl).hostname;
        return host === "localhost" ? ["localhost"] : [host, "localhost"];
      } catch {
        return ["localhost"];
      }
    })(),
  },

  // ------------------------------------------------------------
  // KICK — separate brand, no double-r rule applies here
  // ------------------------------------------------------------
  kick: {
    channelSlug: process.env.KICK_CHANNEL_SLUG ?? "wockkingdagger",
    url: "https://kick.com/wockkingdagger",
  },

  // ------------------------------------------------------------
  // TIKTOK — username: wockkingdaggerr (two r's)
  // Social link only until TikTok Display API credentials added.
  // Featured content configured in lib/featured-content.ts
  // ------------------------------------------------------------
  tiktok: {
    handle: process.env.TIKTOK_HANDLE ?? "@wockkingdaggerr",
    username: process.env.TIKTOK_USERNAME ?? "wockkingdaggerr",
    url: "https://tiktok.com/@wockkingdaggerr",
    profileUrl: "https://www.tiktok.com/@wockkingdaggerr",
  },

  // ------------------------------------------------------------
  // INSTAGRAM — username: wockkingdaggerr (two r's)
  // Social link only until Instagram Graph API credentials added.
  // Featured content configured in lib/featured-content.ts
  // ------------------------------------------------------------
  instagram: {
    handle: process.env.INSTAGRAM_HANDLE ?? "@wockkingdaggerr",
    username: process.env.INSTAGRAM_USERNAME ?? "wockkingdaggerr",
    url: "https://instagram.com/wockkingdaggerr",
    profileUrl: "https://www.instagram.com/wockkingdaggerr",
  },

  // ------------------------------------------------------------
  // PRIMARY PLATFORM ORDER — drives nav, footer, and media tabs
  // ------------------------------------------------------------
  platformOrder: ["twitch", "youtube", "kick", "tiktok", "instagram"] as const,

  // ------------------------------------------------------------
  // STREAM SCHEDULE — update here, flows to StreamSchedule component
  // Day index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // ------------------------------------------------------------
  streamSchedule: [
    { day: "SUN", live: true, time: "6PM ET" },
    { day: "MON", live: false, time: null },
    { day: "TUE", live: true, time: "8PM ET" },
    { day: "WED", live: true, time: "8PM ET" },
    { day: "THU", live: false, time: null },
    { day: "FRI", live: true, time: "9PM ET" },
    { day: "SAT", live: true, time: "7PM ET" },
  ],

  // ------------------------------------------------------------
  // FALLBACK ASSETS
  // ------------------------------------------------------------
  fallbackThumbnail: "/placeholders/thumb-1.svg",
  fallbackAvatar: "/placeholders/avatar.svg",

  // ------------------------------------------------------------
  // SITE CONFIG
  // ------------------------------------------------------------
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

// Social links array — used by nav, footer, OG tags
export const WD_SOCIALS = [
  { platform: "twitch",    label: "Twitch",    handle: WD.twitch.channelLogin,   url: WD.twitch.url },
  { platform: "youtube",   label: "YouTube",   handle: WD.youtube.handleMain,    url: WD.youtube.urlMain },
  { platform: "kick",      label: "Kick",      handle: WD.kick.channelSlug,      url: WD.kick.url },
  { platform: "tiktok",    label: "TikTok",    handle: WD.tiktok.handle,         url: WD.tiktok.url },
  { platform: "instagram", label: "Instagram", handle: WD.instagram.handle,      url: WD.instagram.url },
] as const;

export type WDPlatform = "twitch" | "youtube" | "kick" | "tiktok" | "instagram";
