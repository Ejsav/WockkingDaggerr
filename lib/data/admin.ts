import "server-only";
import { serviceClient } from "@/lib/supabase";
import { logWarn } from "@/lib/log";
import type { Drop, MediaItem, Order } from "@/types";

// ============================================================
// CONTROL ROOM READS
//
// Service-role reads, uncached: the operator needs to see the
// effect of a change immediately, not in five minutes. Only ever
// called from pages that middleware has already gated.
// ============================================================

export interface AdminVariant {
  id: string;
  size: string;
  sku: string;
  inventory_count: number;
  reserved_count: number;
  position: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  currency: string;
  active: boolean;
  variants: AdminVariant[];
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(
      "id,slug,name,category,price_cents,currency,active,position," +
        "product_variants(id,size,sku,inventory_count,reserved_count,position)"
    )
    .order("position", { ascending: true });

  if (error) {
    logWarn("admin.getProducts", { error: error.message });
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as AdminProduct & { product_variants: AdminVariant[] | null };
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      price_cents: r.price_cents,
      currency: r.currency,
      active: r.active,
      variants: (r.product_variants ?? []).sort((a, b) => a.position - b.position),
    };
  });
}

export async function getAdminDrops(): Promise<Drop[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("drops")
    .select("id,slug,name,description,hero_image_url,drops_at,ends_at,product_ids,published")
    .order("drops_at", { ascending: false });

  if (error) {
    logWarn("admin.getDrops", { error: error.message });
    return [];
  }
  return (data ?? []) as unknown as Drop[];
}

export async function getAdminMedia(limit = 100): Promise<MediaItem[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("media_items")
    .select(
      "id,source,kind,external_id,title,description,thumbnail_url,permalink,embed_url," +
        "published_at,duration_seconds,view_count,visible,synced_at"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logWarn("admin.getMedia", { error: error.message });
    return [];
  }
  return (data ?? []) as unknown as MediaItem[];
}

export async function getRecentOrders(limit = 25): Promise<Order[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("orders")
    .select(
      "id,stripe_session_id,stripe_payment_intent_id,email,shipping_name," +
        "total_cents,currency,status,line_items,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logWarn("admin.getOrders", { error: error.message });
    return [];
  }
  return (data ?? []) as unknown as Order[];
}

export interface SyncRun {
  id: string;
  source: string;
  ok: boolean;
  items: number;
  duration_ms: number;
  error: string | null;
  ran_at: string;
}

export async function getRecentSyncRuns(limit = 20): Promise<SyncRun[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("sync_runs")
    .select("id,source,ok,items,duration_ms,error,ran_at")
    .order("ran_at", { ascending: false })
    .limit(limit);

  if (error) {
    logWarn("admin.getSyncRuns", { error: error.message });
    return [];
  }
  return (data ?? []) as unknown as SyncRun[];
}

export interface AdminStats {
  products_active: number;
  units_in_stock: number;
  units_held: number;
  archive_items: number;
  archive_hidden: number;
  drops_published: number;
  subscribers: number;
  orders_paid: number;
  revenue_cents: number;
}

/**
 * Every number the dashboard shows is a live count. There are no
 * illustrative figures anywhere in the control room.
 */
export async function getAdminStats(): Promise<AdminStats | null> {
  const db = serviceClient();
  if (!db) return null;

  const [products, variants, media, hidden, drops, subscribers, orders] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("product_variants").select("inventory_count,reserved_count"),
    db.from("media_items").select("id", { count: "exact", head: true }).eq("visible", true),
    db.from("media_items").select("id", { count: "exact", head: true }).eq("visible", false),
    db.from("drops").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("subscribers").select("id", { count: "exact", head: true }),
    db.from("orders").select("total_cents").eq("status", "paid"),
  ]);

  const variantRows = (variants.data ?? []) as Array<{ inventory_count: number; reserved_count: number }>;
  const orderRows = (orders.data ?? []) as Array<{ total_cents: number }>;

  return {
    products_active: products.count ?? 0,
    units_in_stock: variantRows.reduce((s, v) => s + v.inventory_count, 0),
    units_held: variantRows.reduce((s, v) => s + v.reserved_count, 0),
    archive_items: media.count ?? 0,
    archive_hidden: hidden.count ?? 0,
    drops_published: drops.count ?? 0,
    subscribers: subscribers.count ?? 0,
    orders_paid: orderRows.length,
    revenue_cents: orderRows.reduce((s, o) => s + o.total_cents, 0),
  };
}
