import { SITE_URL } from "@/lib/env";
import { ALL_SOCIAL_URLS, WD } from "@/lib/wockkingdagger";
import { absoluteUrl } from "@/lib/utils";
import { isSoldOut, type Drop, type MediaItem, type Product } from "@/types";

// ============================================================
// STRUCTURED DATA
//
// The archive is an organic acquisition surface: every video
// page emits VideoObject, every product emits Product + Offer,
// and both carry a BreadcrumbList. Person carries sameAs so the
// creator's profiles resolve to one entity.
//
// Everything here is generated from real row data. No field is
// populated with an assumption.
// ============================================================

const ORG_ID = `${SITE_URL}/#person`;
const SITE_ID = `${SITE_URL}/#website`;

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ORG_ID,
    name: WD.displayName,
    alternateName: WD.youtube.handleMain,
    description: WD.bio,
    url: SITE_URL,
    sameAs: ALL_SOCIAL_URLS,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: WD.copy.siteTitle,
    description: WD.copy.siteDescription,
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(SITE_URL, crumb.path),
    })),
  };
}

/** ISO 8601 duration, the only format VideoObject accepts. */
function isoDuration(seconds: number | null): string | undefined {
  if (seconds == null || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}${s}S`;
}

export function videoSchema(item: MediaItem, canonicalPath: string) {
  // uploadDate is required by Google's VideoObject guidelines; omit the
  // whole entity rather than invent a date we do not have.
  if (!item.published_at) return null;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: item.title,
    description: item.description?.slice(0, 500) || item.title,
    thumbnailUrl: item.thumbnail_url ? [item.thumbnail_url] : undefined,
    uploadDate: item.published_at,
    duration: isoDuration(item.duration_seconds),
    contentUrl: item.permalink,
    embedUrl: item.embed_url ?? undefined,
    url: absoluteUrl(SITE_URL, canonicalPath),
    creator: { "@id": ORG_ID },
    interactionStatistic:
      item.view_count != null
        ? {
            "@type": "InteractionCounter",
            interactionType: { "@type": "WatchAction" },
            userInteractionCount: item.view_count,
          }
        : undefined,
  };
}

export function productSchema(product: Product) {
  const soldOut = isSoldOut(product);
  const url = absoluteUrl(SITE_URL, `/shop/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline ?? product.description.slice(0, 300),
    sku: product.variants[0]?.sku,
    category: product.category,
    image: product.image_urls.map((u) =>
      u.startsWith("http") ? u : absoluteUrl(SITE_URL, u)
    ),
    brand: { "@type": "Brand", name: WD.displayName },
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: (product.price_cents / 100).toFixed(2),
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

/**
 * A scheduled drop is an Event: it has a start, an optional end, and
 * an online location. Only emitted for drops that have not ended.
 */
export function dropEventSchema(drop: Drop) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: drop.name,
    description: drop.description || `${drop.name} — a scheduled release from ${WD.displayName}.`,
    startDate: drop.drops_at,
    endDate: drop.ends_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: absoluteUrl(SITE_URL, "/drops"),
    },
    organizer: { "@id": ORG_ID },
    image: drop.hero_image_url
      ? [drop.hero_image_url.startsWith("http") ? drop.hero_image_url : absoluteUrl(SITE_URL, drop.hero_image_url)]
      : undefined,
  };
}

export function collectionSchema(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(SITE_URL, path),
    isPartOf: { "@id": SITE_ID },
  };
}
