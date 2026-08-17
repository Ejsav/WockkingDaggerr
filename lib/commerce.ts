import "server-only";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase";
import { logWarn } from "@/lib/log";
import type { OrderLineItem } from "@/types";

// ============================================================
// SERVER-SIDE CART RESOLUTION
//
// The browser sends identifiers and quantities. It never sends
// a price, a name, or a size — those are read from the database
// here and are the only values that reach Stripe or an order row.
// A tampered request can at worst ask to buy a different variant
// at that variant's real price.
// ============================================================

export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_LINES = 20;

export const cartLineSchema = z.object({
  product_id: z.string().min(1).max(64),
  variant_id: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const cartSchema = z.object({
  lines: z.array(cartLineSchema).min(1).max(MAX_LINES),
});

export type CartInput = z.infer<typeof cartSchema>;

export interface ResolvedLine extends OrderLineItem {
  image_url: string | null;
  currency: string;
  /** Units a shopper could still add: on hand minus already held. */
  available: number;
}

export interface ResolutionResult {
  lines: ResolvedLine[];
  /** Lines dropped because the product or variant no longer exists or is inactive. */
  removed: Array<{ variant_id: string; reason: "unavailable" }>;
  /** Lines whose quantity was reduced to what is actually in stock. */
  adjusted: Array<{ variant_id: string; requested: number; granted: number }>;
  subtotalCents: number;
  currency: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  inventory_count: number;
  reserved_count: number;
  products: {
    id: string;
    slug: string;
    name: string;
    price_cents: number;
    currency: string;
    image_urls: string[] | null;
    active: boolean;
  } | null;
}

/**
 * Resolve a client cart against live database state.
 *
 * Nothing here trusts the caller beyond the identifiers. Quantities
 * are clamped to real availability rather than rejected outright, so
 * a stale tab degrades into a correct cart instead of a dead end.
 */
export async function resolveCart(input: CartInput): Promise<ResolutionResult> {
  const empty: ResolutionResult = {
    lines: [], removed: [], adjusted: [], subtotalCents: 0, currency: "USD",
  };

  const db = serviceClient();
  if (!db) return empty;

  // Collapse duplicate variant lines before hitting the database.
  const requested = new Map<string, number>();
  for (const line of input.lines) {
    requested.set(
      line.variant_id,
      Math.min(MAX_QUANTITY_PER_LINE, (requested.get(line.variant_id) ?? 0) + line.quantity)
    );
  }

  const { data, error } = await db
    .from("product_variants")
    .select(
      "id,product_id,size,inventory_count,reserved_count," +
        "products!inner(id,slug,name,price_cents,currency,image_urls,active)"
    )
    .in("id", Array.from(requested.keys()));

  if (error) {
    logWarn("commerce.resolveCart", { error: error.message });
    return empty;
  }

  const rows = (data ?? []) as unknown as VariantRow[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const lines: ResolvedLine[] = [];
  const removed: ResolutionResult["removed"] = [];
  const adjusted: ResolutionResult["adjusted"] = [];

  for (const [variantId, quantity] of requested) {
    const row = byId.get(variantId);
    const product = row?.products;

    if (!row || !product || !product.active) {
      removed.push({ variant_id: variantId, reason: "unavailable" });
      continue;
    }

    const available = Math.max(0, row.inventory_count - row.reserved_count);
    if (available <= 0) {
      removed.push({ variant_id: variantId, reason: "unavailable" });
      continue;
    }

    const granted = Math.min(quantity, available);
    if (granted < quantity) {
      adjusted.push({ variant_id: variantId, requested: quantity, granted });
    }

    lines.push({
      product_id: product.id,
      variant_id: row.id,
      slug: product.slug,
      name: product.name,
      size: row.size,
      quantity: granted,
      unit_price_cents: product.price_cents,
      image_url: product.image_urls?.[0] ?? null,
      currency: product.currency,
      available,
    });
  }

  const currency = lines[0]?.currency ?? "USD";

  // Mixing currencies in one Stripe session is not possible; refuse rather
  // than silently charging the wrong one.
  if (lines.some((l) => l.currency !== currency)) {
    return { ...empty, removed: lines.map((l) => ({ variant_id: l.variant_id, reason: "unavailable" as const })) };
  }

  return {
    lines,
    removed,
    adjusted,
    subtotalCents: lines.reduce((sum, l) => sum + l.unit_price_cents * l.quantity, 0),
    currency,
  };
}

/** The order-row shape: the display fields stripped back to what belongs on a receipt. */
export function toOrderLineItems(lines: ResolvedLine[]): OrderLineItem[] {
  return lines.map((l) => ({
    product_id: l.product_id,
    variant_id: l.variant_id,
    slug: l.slug,
    name: l.name,
    size: l.size,
    quantity: l.quantity,
    unit_price_cents: l.unit_price_cents,
  }));
}
