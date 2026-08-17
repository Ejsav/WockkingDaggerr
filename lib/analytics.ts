"use client";

// ============================================================
// FUNNEL ANALYTICS
//
// Sends to Vercel Analytics' custom-event channel when the
// script is present, and always mirrors to the console in
// development so the funnel can be traced locally.
//
// The events below are chosen to answer one question after the
// fact: where did a purchase or a signup fall over?
//
//   view_product   → add_to_cart → view_cart
//   → begin_checkout → checkout_redirected → purchase_confirmed
//   signup_submitted → signup_succeeded | signup_failed
//
// No personal data is ever sent — identifiers and counts only.
// ============================================================

export type AnalyticsEvent =
  | "view_product"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "checkout_redirected"
  | "checkout_rejected"
  | "purchase_confirmed"
  | "signup_submitted"
  | "signup_succeeded"
  | "signup_failed"
  | "archive_filtered"
  | "media_played";

type Properties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    va?: (event: "event", payload: { name: string } & Properties) => void;
  }
}

export function track(event: AnalyticsEvent, properties: Properties = {}): void {
  if (typeof window === "undefined") return;

  const clean: Properties = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v !== undefined && v !== null) clean[k] = v;
  }

  try {
    window.va?.("event", { name: event, ...clean });
  } catch {
    // Analytics must never break a purchase.
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, clean);
  }
}
