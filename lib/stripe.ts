import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

// ============================================================
// STRIPE CLIENT
// Returns null when STRIPE_SECRET_KEY is absent. Callers must
// treat that as "checkout is unavailable" — there is no demo
// mode, because a fake success page is worse than an honest
// closed store.
// ============================================================

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = serverEnv.stripeSecretKey;
  if (!key) return null;
  cached ??= new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 15_000,
    appInfo: { name: "wockkingdagger-hub", version: "1.0.0" },
  });
  return cached;
}

export const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL", "BE", "SE", "NO", "DK", "ES", "IT", "PT", "JP"];
