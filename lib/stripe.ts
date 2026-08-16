import Stripe from "stripe";

// ------------------------------------------------------------
// STRIPE CLIENT
// Returns null if STRIPE_SECRET_KEY is missing. Checkout route
// falls back to a demo redirect when this happens.
// ------------------------------------------------------------

export const STRIPE_CONFIGURED = Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}
