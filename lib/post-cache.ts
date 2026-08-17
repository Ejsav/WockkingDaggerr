import type { Post } from "@/types";
import { MOCK_POSTS } from "@/lib/mock-data";

// ------------------------------------------------------------
// IN-MEMORY POST CACHE
// Uses globalThis so the cache survives Next.js hot-reloads
// in development (module-level vars get wiped on every save).
// In production this is a normal singleton for the process lifetime.
// Swap reads/writes for Supabase once credentials are added.
// ------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __wdPostCache: Map<string, Post> | undefined;
  // eslint-disable-next-line no-var
  var __wdSyncedAt: Record<string, number> | undefined;
}

function getCache(): Map<string, Post> {
  if (!globalThis.__wdPostCache) {
    globalThis.__wdPostCache = new Map<string, Post>();
  }
  return globalThis.__wdPostCache;
}

function getSyncedAt(): Record<string, number> {
  if (!globalThis.__wdSyncedAt) {
    globalThis.__wdSyncedAt = {};
  }
  return globalThis.__wdSyncedAt;
}

export function setCachedPosts(posts: Post[]): void {
  const cache = getCache();
  for (const post of posts) {
    cache.set(post.id, post);
  }
}

export function markSynced(platform: string): void {
  getSyncedAt()[platform] = Date.now();
}

export function wasSyncedRecently(platform: string, withinMs = 3_600_000): boolean {
  const last = getSyncedAt()[platform];
  return last !== undefined && Date.now() - last < withinMs;
}

export function getCachedPosts(): Post[] {
  const cache = getCache();

  if (cache.size === 0) {
    // Nothing synced yet — fall back to mock posts (including YouTube,
    // which now uses real, embeddable video IDs) so the archive is never
    // empty before YOUTUBE_API_KEY is configured.
    return MOCK_POSTS;
  }

  // Merge: real synced posts + mock non-YouTube posts for unsynced platforms
  const syncedPlatforms = new Set(Array.from(cache.values()).map((p) => p.platform));
  const mockFallbacks = MOCK_POSTS.filter((p) => !syncedPlatforms.has(p.platform));

  const all = [...Array.from(cache.values()), ...mockFallbacks];
  return all.sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
  );
}

export function getCacheSize(): number {
  return getCache().size;
}
