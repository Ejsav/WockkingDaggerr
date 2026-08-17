import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Gated, per-visitor, or machine-only. None of it belongs in an index.
        disallow: ["/admin", "/admin/", "/api/", "/cart", "/success"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
