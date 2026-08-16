// ============================================================
// FEATURED SOCIAL CONTENT — CONFIGURABLE
// ============================================================
// This file lets you manually pin public social posts that will
// appear on the website without requiring API credentials.
//
// HOW TO ADD TIKTOK VIDEOS:
//   1. Go to TikTok and find a public video by @wockkingdaggerr
//   2. Copy the full video URL:
//      https://www.tiktok.com/@wockkingdaggerr/video/7341234567890123456
//   3. Add the URL and video ID to FEATURED_TIKTOKS below.
//   4. Save and redeploy. The embed will appear on the site.
//
// HOW TO ADD INSTAGRAM POSTS:
//   1. Go to Instagram and find a public post by @wockkingdaggerr
//   2. Copy the post shortcode from the URL:
//      https://www.instagram.com/p/ABC123def/ → shortcode is "ABC123def"
//   3. Add the entry to FEATURED_INSTAGRAM_POSTS below.
//   4. Save and redeploy. The embed will appear on the site.
//
// HOW TO ADD FEATURED YOUTUBE VIDEOS (optional manual pins):
//   Add video IDs to FEATURED_YOUTUBE_VIDEO_IDS for manual homepage pins.
//   These supplement auto-synced videos from the YouTube API.
//
// HOW TO ADD FEATURED TWITCH CLIPS (optional):
//   Add clip slugs to FEATURED_TWITCH_CLIPS.
// ============================================================

import { WD } from "@/lib/wockkingdagger";

// ------------------------------------------------------------
// TIKTOK FEATURED VIDEOS
// Public TikTok videos from @wockkingdaggerr.
// First entry = full embed on homepage. Entries 2-3 = link tiles.
// ------------------------------------------------------------
export interface FeaturedTikTok {
  videoId: string;
  url: string;
  caption?: string;
}

export const FEATURED_TIKTOKS: FeaturedTikTok[] = [
  {
    videoId: "7605321755611172126",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7605321755611172126",
    caption: "latest drop",
  },
  {
    videoId: "7590772271254490398",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7590772271254490398",
    caption: "watch this",
  },
  {
    videoId: "7556369716516900110",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7556369716516900110",
    caption: "on the grind",
  },
  {
    videoId: "7553347709189557535",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7553347709189557535",
    caption: "real talk",
  },
  {
    videoId: "7531051378358209822",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7531051378358209822",
    caption: "check it out",
  },
  {
    videoId: "7524480652624792862",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7524480652624792862",
    caption: "new content",
  },
  {
    videoId: "7517364617685765407",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7517364617685765407",
    caption: "live energy",
  },
  {
    videoId: "7495466754194410783",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7495466754194410783",
    caption: "highlights",
  },
  {
    videoId: "7476627933222817054",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7476627933222817054",
    caption: "big moment",
  },
  {
    videoId: "7424904406577040682",
    url: "https://www.tiktok.com/@wockkingdaggerr/video/7424904406577040682",
    caption: "throwback",
  },
];

// ------------------------------------------------------------
// INSTAGRAM FEATURED POSTS
// Add real public Instagram post shortcodes from @wockkingdaggerr.
// Shortcode is the /p/XXXX/ part of the post URL.
// ------------------------------------------------------------
export interface FeaturedInstagramPost {
  shortcode: string;
  embedUrl: string;
  caption?: string;
}

export const FEATURED_INSTAGRAM_POSTS: FeaturedInstagramPost[] = [
  // Example (replace with real shortcodes from @wockkingdaggerr):
  // {
  //   shortcode: "ABC123def",
  //   embedUrl: "https://www.instagram.com/p/ABC123def/embed/",
  //   caption: "behind the drop",
  // },
  // Add more entries above this line
];

// ------------------------------------------------------------
// FEATURED YOUTUBE VIDEOS (optional manual pins)
// These appear in addition to auto-synced videos.
// ------------------------------------------------------------
export const FEATURED_YOUTUBE_VIDEO_IDS: string[] = [
  // Example:
  // "dQw4w9WgXcQ",
];

// ------------------------------------------------------------
// FEATURED TWITCH CLIPS (optional)
// Clip slugs from clips.twitch.tv
// ------------------------------------------------------------
export interface FeaturedTwitchClip {
  slug: string;
  embedUrl: string;
  title?: string;
}

export const FEATURED_TWITCH_CLIPS: FeaturedTwitchClip[] = [
  // Example:
  // {
  //   slug: "ExampleClipSlug",
  //   embedUrl: "https://clips.twitch.tv/embed?clip=ExampleClipSlug",
  //   title: "insane play",
  // },
];

// ------------------------------------------------------------
// COMPUTED HELPERS — read by components
// ------------------------------------------------------------

export function hasFeaturedTikToks(): boolean {
  return FEATURED_TIKTOKS.length > 0;
}

export function hasFeaturedInstagramPosts(): boolean {
  return FEATURED_INSTAGRAM_POSTS.length > 0;
}

// Build TikTok video URL from a video ID
export function buildTikTokVideoUrl(videoId: string): string {
  return `https://www.tiktok.com/${WD.tiktok.handle}/video/${videoId}`;
}

// Build Instagram embed URL from a shortcode
export function buildInstagramEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/embed/`;
}
