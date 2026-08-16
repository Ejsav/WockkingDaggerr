import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ------------------------------------------------------------
// SUPABASE CLIENT
// Falls back gracefully when credentials are missing. The site
// stays functional via the mock-data layer until env vars are set.
// ------------------------------------------------------------

export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Public, browser-safe client. Reads visible content only.
export function getPublicSupabase(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}

// Service-role client. SERVER ONLY. Used by sync routes and webhooks.
export function getServiceSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );
}
