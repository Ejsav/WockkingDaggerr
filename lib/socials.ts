// ------------------------------------------------------------
// SOCIAL LINKS — re-exported from wockkingdagger.ts
// wockkingdagger.ts is the single source of truth.
// This file exists for backwards compatibility with components
// that import from @/lib/socials.
//
// DO NOT add new handles here. Edit lib/wockkingdagger.ts.
// ------------------------------------------------------------

import { WD } from "@/lib/wockkingdagger";

export const SOCIALS = {
  youtube: {
    label: "YouTube",
    handle: WD.youtube.handleMain,
    url: WD.youtube.urlMain,
  },
  youtube2: {
    label: "YouTube Live",
    handle: WD.youtube.handleLive,
    url: WD.youtube.urlLive,
  },
  twitch: {
    label: "Twitch",
    handle: WD.twitch.channelLogin,
    url: WD.twitch.url,
  },
  kick: {
    label: "Kick",
    handle: WD.kick.channelSlug,
    url: WD.kick.url,
  },
  tiktok: {
    label: "TikTok",
    handle: WD.tiktok.handle,
    url: WD.tiktok.url,
  },
  instagram: {
    label: "Instagram",
    handle: WD.instagram.handle,
    url: WD.instagram.url,
  },
} as const;

// Primary platforms shown in nav (condensed)
export const NAV_SOCIALS = [
  SOCIALS.twitch,
  SOCIALS.kick,
  SOCIALS.youtube,
  SOCIALS.tiktok,
  SOCIALS.instagram,
] as const;

// All platforms shown in footer
export const FOOTER_SOCIALS = [
  SOCIALS.youtube,
  SOCIALS.youtube2,
  SOCIALS.twitch,
  SOCIALS.kick,
  SOCIALS.tiktok,
  SOCIALS.instagram,
] as const;
