import type { Post, Product, Drop } from "@/types";

// ------------------------------------------------------------
// SEEDED MOCK DATA
// This makes the entire site functional without Supabase.
// Replace these with live Supabase reads once credentials exist.
// NOTE: All platform handles use the correct double-r username
//       where applicable (wockkingdaggerr).
// ------------------------------------------------------------

export const MOCK_POSTS: Post[] = [
  {
    id: "post_yt_01",
    platform: "youtube",
    external_id: "dQw4w9WgXcQ",
    title: "BLADE WORK — A Visual Manifesto",
    description: "Six minutes inside the world of WockkingDagger. Studio cuts, street footage, voiceover.",
    thumbnail_url: "/placeholders/thumb-1.svg",
    embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    permalink: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    posted_at: "2026-05-12T14:00:00Z",
    duration_seconds: 372,
    view_count: 184320,
    visible: true,
    tags: ["manifesto", "long-form"],
  },
  {
    id: "post_yt_02",
    platform: "youtube",
    external_id: "vid_002",
    title: "Studio Diary 04 — Pressure Makes The Edge",
    description: "Behind the next drop. Late nights, raw footage, no filter.",
    thumbnail_url: "/placeholders/thumb-2.svg",
    embed_url: "https://www.youtube.com/embed/vid_002",
    permalink: "https://youtube.com/watch?v=vid_002",
    posted_at: "2026-05-04T19:30:00Z",
    duration_seconds: 528,
    view_count: 92110,
    visible: true,
    tags: ["studio-diary"],
  },
  {
    id: "post_yt_03",
    platform: "youtube",
    external_id: "vid_003",
    title: "On Building A Brand In Hostile Territory",
    description: "Long-form. The story so far.",
    thumbnail_url: "/placeholders/thumb-3.svg",
    embed_url: "https://www.youtube.com/embed/vid_003",
    permalink: "https://youtube.com/watch?v=vid_003",
    posted_at: "2026-04-22T12:00:00Z",
    duration_seconds: 1142,
    view_count: 67800,
    visible: true,
    tags: ["essay"],
  },
  {
    id: "post_tt_01",
    platform: "tiktok",
    external_id: "7341234567890123456",
    title: "When the drop hits and the server doesn't.",
    description: null,
    thumbnail_url: "/placeholders/thumb-4.svg",
    embed_url: "https://www.tiktok.com/embed/v2/7341234567890123456",
    permalink: "https://www.tiktok.com/@wockkingdaggerr/video/7341234567890123456",
    posted_at: "2026-05-18T22:15:00Z",
    duration_seconds: 38,
    view_count: 412000,
    visible: true,
    tags: ["short"],
  },
  {
    id: "post_tt_02",
    platform: "tiktok",
    external_id: "7341234567890999999",
    title: "Three minutes of footage, one second of magic.",
    description: null,
    thumbnail_url: "/placeholders/thumb-5.svg",
    embed_url: "https://www.tiktok.com/embed/v2/7341234567890999999",
    permalink: "https://www.tiktok.com/@wockkingdaggerr/video/7341234567890999999",
    posted_at: "2026-05-16T17:42:00Z",
    duration_seconds: 22,
    view_count: 188000,
    visible: true,
    tags: ["short", "studio"],
  },
  {
    id: "post_ig_01",
    platform: "instagram",
    external_id: "DA1B2C3D4E5",
    title: "Crown of the season.",
    description: null,
    thumbnail_url: "/placeholders/thumb-6.svg",
    embed_url: "https://www.instagram.com/p/DA1B2C3D4E5/embed",
    permalink: "https://www.instagram.com/p/DA1B2C3D4E5/",
    posted_at: "2026-05-20T09:00:00Z",
    duration_seconds: null,
    view_count: 56000,
    visible: true,
    tags: ["editorial"],
  },
  {
    id: "post_ig_02",
    platform: "instagram",
    external_id: "DA9X8Y7Z6W5",
    title: "Backstage. Final pass.",
    description: null,
    thumbnail_url: "/placeholders/thumb-7.svg",
    embed_url: "https://www.instagram.com/p/DA9X8Y7Z6W5/embed",
    permalink: "https://www.instagram.com/p/DA9X8Y7Z6W5/",
    posted_at: "2026-05-15T20:30:00Z",
    duration_seconds: null,
    view_count: 33400,
    visible: true,
    tags: ["editorial", "behind-the-scenes"],
  },
  {
    id: "post_ig_03",
    platform: "instagram",
    external_id: "DA5R4T3Y2U1",
    title: "Workshop floor. Smoke. Steel.",
    description: null,
    thumbnail_url: "/placeholders/thumb-8.svg",
    embed_url: "https://www.instagram.com/p/DA5R4T3Y2U1/embed",
    permalink: "https://www.instagram.com/p/DA5R4T3Y2U1/",
    posted_at: "2026-05-09T11:15:00Z",
    duration_seconds: null,
    view_count: 41200,
    visible: true,
    tags: ["editorial"],
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_01",
    slug: "blade-hoodie-onyx",
    name: "BLADE HOODIE — ONYX",
    tagline: "Heavyweight. Hand-cut. Limited run of 200.",
    description:
      "500gsm cotton fleece in pigment-dyed onyx. Crimson blade embroidery on the chest, foiled crest on the back. Garment-dyed for fade-in-time character. Cut oversized in the body, ribbed cuffs and hem.",
    price_cents: 18500,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 142,
    image_urls: ["/placeholders/product-1.svg"],
    category: "apparel",
    active: true,
    created_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "prod_02",
    slug: "dagger-tee-bone",
    name: "DAGGER TEE — BONE",
    tagline: "Standard issue. Always restocked.",
    description:
      "240gsm heavyweight jersey. Boxy fit. Front-chest blade hit, back graphic in raised plastisol. Pre-washed for zero shrink.",
    price_cents: 6500,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 318,
    image_urls: ["/placeholders/product-2.svg"],
    category: "apparel",
    active: true,
    created_at: "2026-03-12T00:00:00Z",
  },
  {
    id: "prod_03",
    slug: "crest-cap-black",
    name: "CREST CAP — BLACK",
    tagline: "Embroidered six-panel. Strapback.",
    description:
      "Brushed cotton twill. Tonal stitching. Solid brass strap closure. Subtle crest at the front, blade strike at the back.",
    price_cents: 5500,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 96,
    image_urls: ["/placeholders/product-3.svg"],
    category: "headwear",
    active: true,
    created_at: "2026-04-22T00:00:00Z",
  },
  {
    id: "prod_04",
    slug: "manifesto-poster-set",
    name: "MANIFESTO POSTER SET",
    tagline: "Three-print collector set. Numbered.",
    description:
      "Three 18×24 prints on heavyweight matte stock. Each numbered out of 500. Edition closes when stock runs out. Ships flat in protective sleeve.",
    price_cents: 7500,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 421,
    image_urls: ["/placeholders/product-4.svg"],
    category: "print",
    active: true,
    created_at: "2026-02-18T00:00:00Z",
  },
  {
    id: "prod_05",
    slug: "blade-chain-vault",
    name: "BLADE CHAIN — VAULT EDITION",
    tagline: "Stainless dagger pendant. 22-inch box chain.",
    description:
      "316L stainless steel pendant on a 22-inch matte box chain. Hand-finished edge. Etched serial number on the reverse. 1 of 75.",
    price_cents: 24500,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 12,
    image_urls: ["/placeholders/product-5.svg"],
    category: "accessories",
    active: true,
    created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "prod_06",
    slug: "studio-zine-issue-01",
    name: "STUDIO ZINE — ISSUE 01",
    tagline: "64 pages. Saddle-stitched. Documented.",
    description:
      "First print issue. Behind the brand, the build, the early drops. Photography, essays, raw notes from the studio floor. Saddle-stitched, matte cover, uncoated interior.",
    price_cents: 3200,
    currency: "USD",
    stripe_price_id: null,
    inventory_count: 600,
    image_urls: ["/placeholders/product-6.svg"],
    category: "print",
    active: true,
    created_at: "2026-01-30T00:00:00Z",
  },
];

// Keep demo drop timestamps deterministic across the server and browser render.
// Using Date.now() here would produce different props during hydration.
const now = Date.parse("2026-08-17T00:00:00Z");
const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

export function computeDropStatus(drop: Pick<Drop, "drops_at" | "ends_at">): Drop["status"] {
  const now = Date.now();
  const dropsAt = new Date(drop.drops_at).getTime();
  const endsAt = drop.ends_at ? new Date(drop.ends_at).getTime() : null;

  if (now < dropsAt) return "upcoming";
  if (endsAt !== null && now > endsAt) return "ended";
  return "live";
}

export const MOCK_DROPS: Drop[] = [
  {
    id: "drop_03",
    slug: "drop-03-vault",
    name: "DROP 03 — VAULT",
    description:
      "The vault opens once. The Blade Chain returns in 75 numbered pieces, the Onyx Hoodie re-runs at 200, and the first studio zine ships with every order. When the timer hits zero, the door closes.",
    hero_image_url: "/placeholders/drop-hero.svg",
    drops_at: new Date(now + 3 * DAYS + 11 * HOURS).toISOString(),
    ends_at: new Date(now + 10 * DAYS).toISOString(),
    status: "upcoming",
    product_ids: ["prod_05", "prod_01", "prod_06"],
  },
  {
    id: "drop_02",
    slug: "drop-02-bone",
    name: "DROP 02 — BONE",
    description: "Standard issue restock. Always available, never explained.",
    hero_image_url: "/placeholders/drop-hero-2.svg",
    drops_at: new Date(now - 14 * DAYS).toISOString(),
    ends_at: null,
    status: "live",
    product_ids: ["prod_02", "prod_03", "prod_04"],
  },
  {
    id: "drop_01",
    slug: "drop-01-origin",
    name: "DROP 01 — ORIGIN",
    description: "The first one. Sold through. Documented in Issue 01.",
    hero_image_url: "/placeholders/drop-hero-3.svg",
    drops_at: new Date(now - 92 * DAYS).toISOString(),
    ends_at: new Date(now - 80 * DAYS).toISOString(),
    status: "ended",
    product_ids: [],
  },
];

export function getVisiblePosts(): Post[] {
  return [...MOCK_POSTS]
    .filter((p) => p.visible)
    .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
}

export function getPostsByPlatform(platform: Post["platform"]): Post[] {
  return getVisiblePosts().filter((p) => p.platform === platform);
}

export function getActiveProducts(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.active);
}

export function getProductBySlug(slug: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getProductById(id: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getNextDrop(): Drop | null {
  const upcoming = MOCK_DROPS
    .map((d) => ({ ...d, status: computeDropStatus(d) }))
    .filter((d) => d.status === "upcoming")
    .sort((a, b) => new Date(a.drops_at).getTime() - new Date(b.drops_at).getTime());
  return upcoming[0] ?? null;
}

export function getAllDrops(): Drop[] {
  return [...MOCK_DROPS]
    .map((d) => ({ ...d, status: computeDropStatus(d) }))
    .sort((a, b) => new Date(b.drops_at).getTime() - new Date(a.drops_at).getTime());
}

export function getDropBySlug(slug: string): Drop | null {
  return MOCK_DROPS.find((d) => d.slug === slug) ?? null;
}
