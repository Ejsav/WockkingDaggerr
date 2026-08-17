// Country names for the legal pages, derived from the same list the
// checkout session is created with. If one changes, both change.

const NAMES: Record<string, string> = {
  US: "the United States",
  CA: "Canada",
  GB: "the United Kingdom",
  IE: "Ireland",
  AU: "Australia",
  NZ: "New Zealand",
  DE: "Germany",
  FR: "France",
  NL: "the Netherlands",
  BE: "Belgium",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  JP: "Japan",
};

/** Kept in step with SHIPPING_COUNTRIES in lib/stripe.ts. */
const CODES = [
  "US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL",
  "BE", "SE", "NO", "DK", "ES", "IT", "PT", "JP",
] as const;

export const SHIPPING_COUNTRIES_DISPLAY = CODES.map((c) => NAMES[c] ?? c).join(", ");
