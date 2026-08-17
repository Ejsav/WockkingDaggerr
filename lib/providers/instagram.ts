import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { WD } from "@/lib/wockkingdagger";
import type { MediaItem } from "@/types";
import { failed, skipped, type ProviderResult } from "@/lib/providers/types";

// ============================================================
// INSTAGRAM — Graph API media edge
//
// Needs a Business/Creator account and a long-lived token, which
// expires every 60 days. When the token lapses the sync reports a
// failure in sync_runs and the existing rows stay visible rather
// than the archive emptying itself.
// ============================================================

const GRAPH = "https://graph.instagram.com";
const FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

interface IgMedia {
  id?: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

function titleFrom(caption: string | undefined): string {
  const text = (caption ?? "").trim().replace(/\s+/g, " ");
  if (!text) return `${WD.instagram.handle} on Instagram`;
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

export async function fetchInstagram(): Promise<ProviderResult> {
  const token = serverEnv.instagramAccessToken;
  const userId = serverEnv.instagramUserId;
  if (!token || !userId) {
    return skipped("INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID not set");
  }

  const items: MediaItem[] = [];
  let next: string | null =
    `${GRAPH}/${encodeURIComponent(userId)}/media?fields=${FIELDS}&limit=50&access_token=${encodeURIComponent(token)}`;
  let pages = 0;

  try {
    while (next && pages < 4) {
      const res: Response = await fetchWithTimeout(next, { timeoutMs: 8000 });
      if (!res.ok) return failed(`instagram media: HTTP ${res.status}`);

      const json = (await res.json()) as {
        data?: IgMedia[];
        paging?: { next?: string };
        error?: { message?: string };
      };
      if (json.error) return failed(`instagram media: ${json.error.message ?? "error"}`);

      for (const m of json.data ?? []) {
        if (!m.id || !m.permalink) continue;
        items.push({
          id: `instagram:${m.id}`,
          source: "instagram",
          kind: "post",
          external_id: m.id,
          title: titleFrom(m.caption),
          description: m.caption?.trim() || null,
          thumbnail_url: m.thumbnail_url ?? m.media_url ?? null,
          permalink: m.permalink,
          embed_url: `${m.permalink.replace(/\/+$/, "")}/embed/`,
          published_at: m.timestamp ?? null,
          duration_seconds: null,
          view_count: null,
          visible: true,
          synced_at: new Date().toISOString(),
        });
      }

      next = json.paging?.next ?? null;
      pages += 1;
    }
  } catch (err) {
    return failed((err as Error).message);
  }

  return { items, configured: true, error: null };
}
