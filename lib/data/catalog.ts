import "server-only";
import { unstable_cache } from "next/cache";
import { readClient, TAGS } from "@/lib/supabase";
import { logError } from "@/lib/log";
import type { Drop, Product, ProductVariant } from "@/types";
import { computeDropStatus } from "@/types";

// ============================================================
// CATALOG READS
//
// Every function here is cached and tagged. A page that calls
// them renders from cache; the cache is invalidated by an admin
// mutation or a cron sync, never by a request from a visitor.
//
// When Supabase is not configured these return empty results and
// the UI renders an honest unavailable state. They never invent
// data to fill a gap.
// ============================================================

const CACHE_SECONDS = 300;

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  image_urls: string[] | null;
  category: string;
  active: boolean;
  created_at: string;
  product_variants: Array<{
    id: string;
    product_id: string;
    size: string;
    sku: string;
    inventory_count: number;
    reserved_count: number;
    position: number;
  }> | null;
}

/** Available stock is what a shopper can actually buy: on hand minus held. */
function toVariant(row: NonNullable<ProductRow["product_variants"]>[number]): ProductVariant {
  return {
    id: row.id,
    product_id: row.product_id,
    size: row.size,
    sku: row.sku,
    inventory_count: Math.max(0, row.inventory_count - row.reserved_count),
    position: row.position,
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    price_cents: row.price_cents,
    currency: row.currency,
    stripe_price_id: row.stripe_price_id,
    image_urls: row.image_urls ?? [],
    category: row.category,
    active: row.active,
    created_at: row.created_at,
    variants: (row.product_variants ?? [])
      .map(toVariant)
      .sort((a, b) => a.position - b.position),
  };
}

const PRODUCT_SELECT =
  "id,slug,name,tagline,description,price_cents,currency,stripe_price_id,image_urls,category,active,created_at," +
  "product_variants(id,product_id,size,sku,inventory_count,reserved_count,position)";

export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const db = readClient();
    if (!db) return [];
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      logError("catalog.getProducts", error);
      return [];
    }
    return (data as unknown as ProductRow[]).map(toProduct);
  },
  ["catalog:products"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.products] }
);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductCategories(): Promise<string[]> {
  const products = await getProducts();
  return Array.from(new Set(products.map((p) => p.category))).sort();
}

// ------------------------------------------------------------
// DROPS
// ------------------------------------------------------------

export const getDrops = unstable_cache(
  async (): Promise<Drop[]> => {
    const db = readClient();
    if (!db) return [];
    const { data, error } = await db
      .from("drops")
      .select("id,slug,name,description,hero_image_url,drops_at,ends_at,product_ids,published")
      .eq("published", true)
      .order("drops_at", { ascending: false });

    if (error) {
      logError("catalog.getDrops", error);
      return [];
    }
    return (data ?? []) as unknown as Drop[];
  },
  ["catalog:drops"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.drops] }
);

export interface DropsView {
  upcoming: Drop | null;
  live: Drop[];
  ended: Drop[];
}

/**
 * Status is derived at read time, so the page is correct the
 * instant a countdown reaches zero — no cron, no stale column.
 */
export async function getDropsView(now: number = Date.now()): Promise<DropsView> {
  const drops = await getDrops();
  const upcoming = drops
    .filter((d) => computeDropStatus(d, now) === "upcoming")
    .sort((a, b) => new Date(a.drops_at).getTime() - new Date(b.drops_at).getTime());

  return {
    upcoming: upcoming[0] ?? null,
    live: drops.filter((d) => computeDropStatus(d, now) === "live"),
    ended: drops.filter((d) => computeDropStatus(d, now) === "ended"),
  };
}

export async function getDropProducts(drop: Drop): Promise<Product[]> {
  if (drop.product_ids.length === 0) return [];
  const products = await getProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  return drop.product_ids
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p));
}
