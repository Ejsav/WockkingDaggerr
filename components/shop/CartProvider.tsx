"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/types";

// ============================================================
// CART STATE
//
// localStorage holds identifiers and quantities only — never a
// price. Prices, names, sizes and availability are resolved
// server side on every read (/api/cart/validate) and again at
// checkout, so a stale or edited cart cannot change what a
// shopper is charged.
//
// The store is read through useSyncExternalStore rather than an
// effect. That gives three things for free: no setState-in-
// effect cascade, a correct server snapshot (empty cart) so
// hydration matches, and cross-tab sync via the `storage` event.
// ============================================================

const STORAGE_KEY = "wd_cart_v1";
const MAX_QTY = 10;
const MAX_LINES = 20;

// ------------------------------------------------------------
// EXTERNAL STORE
// ------------------------------------------------------------

const EMPTY: CartLine[] = [];

/** Cached so getSnapshot returns a stable reference between writes. */
let snapshot: CartLine[] = EMPTY;
let snapshotSource: string | null = null;

const listeners = new Set<() => void>();

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const lines = parsed
      .filter(
        (l): l is CartLine =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as CartLine).product_id === "string" &&
          typeof (l as CartLine).variant_id === "string" &&
          Number.isInteger((l as CartLine).quantity)
      )
      .map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        quantity: Math.min(MAX_QTY, Math.max(1, l.quantity)),
      }))
      .slice(0, MAX_LINES);
    return lines.length > 0 ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode with storage blocked. The cart degrades to per-page-view.
    return null;
  }
}

function getSnapshot(): CartLine[] {
  const raw = readStorage();
  if (raw !== snapshotSource) {
    snapshotSource = raw;
    snapshot = parse(raw);
  }
  return snapshot;
}

/** The server has no cart. Returning a stable empty array keeps SSR and
 *  the first client render identical, so there is no hydration warning. */
function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: hold the value in the snapshot for this page view.
    snapshotSource = JSON.stringify(next);
    snapshot = next;
  }
  // `storage` does not fire in the tab that wrote, so notify locally.
  for (const listener of listeners) listener();
}

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

interface CartContextValue {
  lines: CartLine[];
  count: number;
  /** True once the browser store has been read. False during SSR. */
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const add = useCallback((line: CartLine) => {
    const current = getSnapshot();
    const existing = current.find((l) => l.variant_id === line.variant_id);
    const next = existing
      ? current.map((l) =>
          l.variant_id === line.variant_id
            ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + line.quantity) }
            : l
        )
      : [...current, { ...line, quantity: Math.min(MAX_QTY, Math.max(1, line.quantity)) }].slice(
          0,
          MAX_LINES
        );
    write(next);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const clamped = Math.min(MAX_QTY, Math.max(0, Math.floor(quantity)));
    const current = getSnapshot();
    write(
      clamped === 0
        ? current.filter((l) => l.variant_id !== variantId)
        : current.map((l) => (l.variant_id === variantId ? { ...l, quantity: clamped } : l))
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    write(getSnapshot().filter((l) => l.variant_id !== variantId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
