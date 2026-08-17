import type { MetadataRoute } from "next";
import { getMediaItems } from "@/lib/data/media";
import { getProducts, getDrops } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";

// ============================================================
// SITEMAP
//
// Only canonical, indexable, 200-returning URLs. Specifically
// excluded:
//   /cart, /success  noindex, per-visitor
//   /admin/*         gated, noindex
//   /watch?source=…  filtered views, reachable from /watch
//   any redirecting path
//
// Every entry below is a real page whose canonical tag points at
// the same URL listed here.
// ============================================================

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [media, products, drops] = await Promise.all([
    getMediaItems(),
    getProducts(),
    getDrops(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(SITE_URL, "/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(SITE_URL, "/watch"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl(SITE_URL, "/shop"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl(SITE_URL, "/drops"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl(SITE_URL, "/legal/shipping-returns"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl(SITE_URL, "/legal/terms"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl(SITE_URL, "/legal/privacy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(SITE_URL, `/shop/${p.slug}`),
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // The archive is the long tail. Newest first, capped so the file
  // stays inside the 50,000-URL / 50MB limit without a sitemap index.
  const mediaRoutes: MetadataRoute.Sitemap = media.slice(0, 5000).map((item) => ({
    url: absoluteUrl(SITE_URL, `/watch/${item.source}/${item.external_id}`),
    lastModified: item.published_at ? new Date(item.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Drops have no page of their own; they are sections of /drops. Listing
  // them individually would put redirects or 404s in the sitemap.
  const dropSignal: MetadataRoute.Sitemap =
    drops.length > 0
      ? [
          {
            url: absoluteUrl(SITE_URL, "/drops"),
            lastModified: new Date(
              Math.max(...drops.map((d) => new Date(d.drops_at).getTime()))
            ),
            changeFrequency: "daily",
            priority: 0.85,
          },
        ]
      : [];

  // De-duplicate: /drops appears in both static routes and the signal above.
  const seen = new Set<string>();
  return [...dropSignal, ...staticRoutes, ...productRoutes, ...mediaRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
