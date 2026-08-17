import "server-only";
import { invalidate, serviceClient, TAGS } from "@/lib/supabase";
import { logError, logInfo, logWarn } from "@/lib/log";
import type { MediaItem, MediaSource } from "@/types";
import type { ProviderResult } from "@/lib/providers/types";

// ============================================================
// SYNC ENGINE
//
// One shape for every provider: fetch → upsert → prune → mark
// clean → invalidate the cache tag. Called only from cron-
// authenticated routes.
//
// Two invariants:
//   * A provider failure never empties the archive. Rows are
//     upserted, never truncated-then-inserted, so a bad run
//     leaves yesterday's content in place.
//   * Content the creator deleted upstream disappears here too,
//     but only when the run actually succeeded and returned data.
// ============================================================

export interface SyncOutcome {
  source: string;
  ok: boolean;
  skipped: boolean;
  items: number;
  removed: number;
  durationMs: number;
  error: string | null;
}

const UPSERT_CHUNK = 200;

export async function runMediaSync(
  source: MediaSource,
  fetcher: () => Promise<ProviderResult>
): Promise<SyncOutcome> {
  const startedAt = Date.now();
  const base = { source, items: 0, removed: 0, durationMs: 0, error: null as string | null };

  const db = serviceClient();
  if (!db) {
    return { ...base, ok: false, skipped: true, durationMs: Date.now() - startedAt,
      error: "Supabase service role not configured" };
  }

  let result: ProviderResult;
  try {
    result = await fetcher();
  } catch (err) {
    const ref = logError("sync.provider", err, { source });
    const outcome: SyncOutcome = { ...base, ok: false, skipped: false,
      durationMs: Date.now() - startedAt, error: `provider threw (ref ${ref})` };
    await recordRun(outcome);
    return outcome;
  }

  if (!result.configured) {
    const outcome: SyncOutcome = { ...base, ok: true, skipped: true,
      durationMs: Date.now() - startedAt, error: result.error };
    logInfo("sync.skipped", { source, reason: result.error });
    return outcome;
  }

  if (result.items.length === 0) {
    const outcome: SyncOutcome = { ...base, ok: !result.error, skipped: false,
      durationMs: Date.now() - startedAt, error: result.error };
    if (result.error) logWarn("sync.empty", { source, error: result.error });
    await recordRun(outcome);
    return outcome;
  }

  // ---- upsert in chunks so a large first sync does not blow the payload cap
  for (let i = 0; i < result.items.length; i += UPSERT_CHUNK) {
    const chunk = result.items.slice(i, i + UPSERT_CHUNK).map(toRow);
    const { error } = await db.from("media_items").upsert(chunk, { onConflict: "id" });
    if (error) {
      const ref = logError("sync.upsert", error, { source, chunk: i });
      const outcome: SyncOutcome = { ...base, ok: false, skipped: false,
        items: i, durationMs: Date.now() - startedAt, error: `upsert failed (ref ${ref})` };
      await recordRun(outcome);
      return outcome;
    }
  }

  // ---- prune content that no longer exists upstream
  let removed = 0;
  const keepIds = result.items.map((i) => i.id);
  const { data: deleted, error: pruneError } = await db
    .from("media_items")
    .delete()
    .eq("source", source)
    .not("id", "in", `(${keepIds.map((id) => `"${id}"`).join(",")})`)
    .select("id");

  if (pruneError) {
    // Stale rows are a smaller problem than a failed sync — log and carry on.
    logWarn("sync.prune_failed", { source, error: pruneError.message });
  } else {
    removed = deleted?.length ?? 0;
  }

  const outcome: SyncOutcome = {
    source,
    ok: true,
    skipped: false,
    items: result.items.length,
    removed,
    durationMs: Date.now() - startedAt,
    error: result.error,
  };

  await recordRun(outcome);
  invalidate(TAGS.media);
  logInfo("sync.ok", { source, items: outcome.items, removed, ms: outcome.durationMs });
  return outcome;
}

function toRow(item: MediaItem) {
  return {
    id: item.id,
    source: item.source,
    kind: item.kind,
    external_id: item.external_id,
    title: item.title,
    description: item.description,
    thumbnail_url: item.thumbnail_url,
    permalink: item.permalink,
    embed_url: item.embed_url,
    published_at: item.published_at,
    duration_seconds: item.duration_seconds,
    view_count: item.view_count,
    visible: item.visible,
    synced_at: item.synced_at,
  };
}

export async function recordRun(outcome: SyncOutcome): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("sync_runs").insert({
    source: outcome.source,
    ok: outcome.ok,
    items: outcome.items,
    duration_ms: outcome.durationMs,
    error: outcome.error,
  });
  if (error) logWarn("sync.record_failed", { source: outcome.source, error: error.message });
}

/**
 * Release inventory held by checkout sessions that never completed.
 * Runs on every cron tick so a shopper who abandons Stripe does not
 * hold the last hoodie hostage until the session expires.
 */
export async function sweepReservations(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data, error } = await db.rpc("sweep_expired_reservations");
  if (error) {
    logWarn("sync.sweep_failed", { error: error.message });
    return 0;
  }
  const swept = typeof data === "number" ? data : 0;
  if (swept > 0) {
    invalidate(TAGS.products);
    logInfo("sync.swept_reservations", { swept });
  }
  return swept;
}
