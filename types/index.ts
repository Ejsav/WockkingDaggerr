// ============================================================
// DOMAIN TYPES
// These mirror the Supabase schema in supabase/migrations.
// Column names are snake_case on purpose: rows cross the wire
// unchanged, so there is no mapping layer to drift.
// ============================================================

export type MediaSource = "youtube" | "twitch" | "tiktok" | "instagram";
export type MediaKind = "video" | "vod" | "short" | "post";

/** A single piece of published content, synced from a platform. */
export interface MediaItem {
  id: string; // "youtube:VIDEO_ID" — stable across syncs
  source: MediaSource;
  kind: MediaKind;
  external_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  permalink: string;
  embed_url: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  view_count: number | null;
  visible: boolean;
  synced_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  /** "S" | "M" | … | "ONE_SIZE". Carried end to end: cart, Stripe metadata, order row. */
  size: string;
  sku: string;
  inventory_count: number;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  image_urls: string[];
  category: string;
  active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

/** Derived, never stored: a product is sold out when every variant is at zero. */
export function isSoldOut(product: Pick<Product, "variants">): boolean {
  return product.variants.every((v) => v.inventory_count <= 0);
}

export function totalInventory(product: Pick<Product, "variants">): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.inventory_count), 0);
}

export type DropStatus = "upcoming" | "live" | "ended";

export interface Drop {
  id: string;
  slug: string;
  name: string;
  description: string;
  hero_image_url: string | null;
  drops_at: string;
  ends_at: string | null;
  product_ids: string[];
  published: boolean;
}

/** Status is computed from the clock, never read from a column that can go stale. */
export function computeDropStatus(
  drop: Pick<Drop, "drops_at" | "ends_at">,
  now: number = Date.now()
): DropStatus {
  const dropsAt = new Date(drop.drops_at).getTime();
  const endsAt = drop.ends_at ? new Date(drop.ends_at).getTime() : null;
  if (!Number.isFinite(dropsAt)) return "upcoming";
  if (now < dropsAt) return "upcoming";
  if (endsAt !== null && Number.isFinite(endsAt) && now > endsAt) return "ended";
  return "live";
}

export type OrderStatus = "paid" | "fulfilled" | "refunded";

export interface OrderLineItem {
  product_id: string;
  variant_id: string;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  email: string | null;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  line_items: OrderLineItem[];
  shipping_name: string | null;
  created_at: string;
}

export interface LiveStatus {
  is_live: boolean;
  platform: "twitch";
  channel: string;
  title: string | null;
  game: string | null;
  viewer_count: number | null;
  started_at: string | null;
  checked_at: string;
}

/** A cart line as held in the browser. Prices are display-only and re-resolved server side. */
export interface CartLine {
  product_id: string;
  variant_id: string;
  quantity: number;
}
