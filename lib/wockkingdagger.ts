import { SITE_URL, TWITCH_PARENTS } from "@/lib/env";

// ============================================================
// CREATOR IDENTITY
// One source of truth for handles, profile URLs and brand copy.
// Pure constants only — no secrets, no runtime configuration.
// Safe to import from client components.
//
// USERNAME RULES (they are not typos):
//   Twitch / TikTok / Instagram / YouTube main: wockkingdaggerr
//   YouTube secondary:                          wockkingdaggerlive
//   Kick:                                       wockkingdagger
// ============================================================

export const WD = {
  displayName: "WockkingDagger",
  legalName: "WockkingDagger",
  tagline: "Streamer. Creator. Builder.",
  bio: "Started with a camera and an internet connection. Built a following on raw content — no algorithm tricks, no manufactured moments. The channel is the record. The drops are the proof.",

  copy: {
    siteTitle: "WockkingDagger",
    siteDescription:
      "The official hub for WockkingDagger. Live streams, the full video archive, drops, and the store.",
    archiveTitle: "The Archive",
    archiveDescription:
      "Every upload, VOD and short in one place. Synced from YouTube, Twitch, TikTok and Instagram.",
  },

  youtube: {
    handleMain: "@wockkingdaggerr",
    handleLive: "@wockkingdaggerlive",
    urlMain: "https://www.youtube.com/@wockkingdaggerr",
    urlLive: "https://www.youtube.com/@wockkingdaggerlive",
  },
  twitch: {
    channelLogin: "wockkingdaggerr",
    url: "https://www.twitch.tv/wockkingdaggerr",
    /** Hosts Twitch will allow to embed the player. */
    parents: TWITCH_PARENTS,
  },
  kick: {
    channelSlug: "wockkingdagger",
    url: "https://kick.com/wockkingdagger",
  },
  tiktok: {
    handle: "@wockkingdaggerr",
    url: "https://www.tiktok.com/@wockkingdaggerr",
    profileUrl: "https://www.tiktok.com/@wockkingdaggerr",
  },
  instagram: {
    handle: "@wockkingdaggerr",
    url: "https://www.instagram.com/wockkingdaggerr/",
    profileUrl: "https://www.instagram.com/wockkingdaggerr/",
  },

  siteUrl: SITE_URL,
} as const;

export interface SocialLink {
  platform: "twitch" | "youtube" | "kick" | "tiktok" | "instagram";
  label: string;
  handle: string;
  url: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: "twitch", label: "Twitch", handle: WD.twitch.channelLogin, url: WD.twitch.url },
  { platform: "youtube", label: "YouTube", handle: WD.youtube.handleMain, url: WD.youtube.urlMain },
  { platform: "youtube", label: "YouTube Live", handle: WD.youtube.handleLive, url: WD.youtube.urlLive },
  { platform: "kick", label: "Kick", handle: WD.kick.channelSlug, url: WD.kick.url },
  { platform: "tiktok", label: "TikTok", handle: WD.tiktok.handle, url: WD.tiktok.url },
  { platform: "instagram", label: "Instagram", handle: WD.instagram.handle, url: WD.instagram.url },
];

/** Condensed set for the header. */
export const NAV_SOCIALS = SOCIAL_LINKS.filter((s) => s.label !== "YouTube Live");

/** Every profile, for the footer and for schema.org `sameAs`. */
export const ALL_SOCIAL_URLS = SOCIAL_LINKS.map((s) => s.url);
