import "server-only";
import { revalidateTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, serverEnv } from "@/lib/env";

// ============================================================
// SUPABASE CLIENTS — server side only.
//
// `server-only` makes an accidental import from a client
// component a build error rather than a leaked service key.
//
// Two clients, two jobs:
//   readClient()    anon key, RLS enforced — page reads
//   serviceClient() service key, RLS bypassed — sync, webhooks,
//                   admin mutations. Never reachable from a
//                   browser.
// ============================================================

let cachedRead: SupabaseClient | null = null;
let cachedService: SupabaseClient | null = null;

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { "x-application-name": "wockkingdagger-hub" } },
} as const;

export function readClient(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  cachedRead ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
  return cachedRead;
}

export function serviceClient(): SupabaseClient | null {
  const key = serverEnv.supabaseServiceKey;
  if (!SUPABASE_URL || !key) return null;
  cachedService ??= createClient(SUPABASE_URL, key, clientOptions);
  return cachedService;
}

export { SUPABASE_CONFIGURED };

// ------------------------------------------------------------
// CACHE TAGS — the contract between sync/mutation writes and
// the pages that render their output. A write revalidates a tag;
// every cached read carrying that tag is invalidated at once.
// ------------------------------------------------------------
export const TAGS = {
  media: "media",
  products: "products",
  drops: "drops",
  live: "live",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Invalidate every cached read carrying `tag`.
 *
 * Next 16 requires a cache-life profile alongside the tag; "max" means
 * "this content is expected to be long-lived, purge it now" — which is
 * exactly the case here, since writes are rare and reads are cached for
 * minutes at a time.
 */
export function invalidate(tag: CacheTag): void {
  revalidateTag(tag, "max");
}
