import type { MetadataRoute } from "next";
import { MOCK_PRODUCTS, getAllDrops, getVisiblePosts } from "@/lib/mock-data";
import { getCachedPosts } from "@/lib/post-cache";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://wockkingdagger.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static routes
  const static_routes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/watch`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/drops`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
  ];

  // Individual product pages
  const product_routes: MetadataRoute.Sitemap = MOCK_PRODUCTS.filter((p) => p.active).map((p) => ({
    url: `${BASE}/shop/${p.slug}`,
    lastModified: p.created_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Individual video pages — prefer live cache, fall back to mock
  const posts = getCachedPosts().length > 0 ? getCachedPosts() : getVisiblePosts();
  const video_routes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/watch/${p.id}`,
    lastModified: p.posted_at,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...static_routes, ...product_routes, ...video_routes];
}
