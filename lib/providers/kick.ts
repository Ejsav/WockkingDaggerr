import { WD } from "@/lib/wockkingdagger";
import type { MediaItem } from "@/lib/media";

// ============================================================
// KICK PROVIDER — PLACEHOLDER
// Kick does not have a stable, documented public API.
// The v1 endpoint is unofficial and returns 403 for some channels.
// This file is the correct place to build Kick integration when
// an official API path becomes available.
//
// Current status:
//   - Social link: ✓ (lib/wockkingdagger.ts)
//   - Live embed:  Kick player at https://player.kick.com/{slug}
//   - VODs:        Not publicly available via API
//   - Live status: Unreliable via unofficial v1 API
// ============================================================

export interface KickLiveResult {
  isLive: boolean;
  configured: boolean;
  channelSlug: string;
  title: string | null;
  viewerCount: number | null;
  error: string | null;
}

export async function getKickLiveStatus(): Promise<KickLiveResult> {
  const slug = WD.kick.channelSlug;

  try {
    const res = await fetch(`https://kick.com/api/v1/channels/${slug}`, {
      headers: { Accept: "application/json", "User-Agent": "WockkingDagger-Hub/1.0" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return { isLive: false, configured: true, channelSlug: slug, title: null, viewerCount: null, error: `Kick API ${res.status}` };
    }

    const json = await res.json();
    const livestream = json.livestream;

    if (!livestream) {
      return { isLive: false, configured: true, channelSlug: slug, title: null, viewerCount: null, error: null };
    }

    return {
      isLive: true,
      configured: true,
      channelSlug: slug,
      title: livestream.session_title ?? null,
      viewerCount: livestream.viewer_count ?? null,
      error: null,
    };
  } catch (err: any) {
    return { isLive: false, configured: true, channelSlug: slug, title: null, viewerCount: null, error: err?.message };
  }
}

// Embed URL for Kick player — no auth required
export function getKickEmbedUrl(slug: string): string {
  return `https://player.kick.com/${slug}?autoplay=true`;
}
