"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Fires the top of the purchase funnel once per product view.
// Split out so the product page itself stays a server component.
export default function ViewTracker({
  productId,
  slug,
  priceCents,
}: {
  productId: string;
  slug: string;
  priceCents: number;
}) {
  useEffect(() => {
    track("view_product", { product_id: productId, slug, value_cents: priceCents });
  }, [productId, slug, priceCents]);

  return null;
}
