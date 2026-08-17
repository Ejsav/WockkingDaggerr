"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/shop/CartProvider";
import { track } from "@/lib/analytics";

/**
 * Empties the cart once, and only after the server has verified the
 * payment. Rendering this component is the signal — the client never
 * decides for itself that an order succeeded.
 */
export default function ClearCartOnSuccess({ totalCents }: { totalCents: number }) {
  const { clear, ready, count } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    if (count > 0) clear();
    track("purchase_confirmed", { value_cents: totalCents });
  }, [ready, count, clear, totalCents]);

  return null;
}
