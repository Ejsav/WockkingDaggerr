import { describe, expect, it } from "vitest";
import {
  breadcrumbSchema,
  dropEventSchema,
  personSchema,
  productSchema,
  videoSchema,
} from "@/lib/schema";
import type { Drop, MediaItem, Product } from "@/types";

// Structured data is a contract with a crawler. A missing required field
// does not throw — it silently drops the rich result, which is exactly the
// kind of failure nobody notices for months.

const video: MediaItem = {
  id: "youtube:abc",
  source: "youtube",
  kind: "video",
  external_id: "abc",
  title: "A video",
  description: "Some description",
  thumbnail_url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
  permalink: "https://www.youtube.com/watch?v=abc",
  embed_url: "https://www.youtube-nocookie.com/embed/abc",
  published_at: "2026-05-01T10:00:00Z",
  duration_seconds: 3723,
  view_count: 1234,
  visible: true,
  synced_at: "2026-06-01T00:00:00Z",
};

const product: Product = {
  id: "prod_1",
  slug: "blade-hoodie-onyx",
  name: "BLADE HOODIE",
  tagline: "Heavyweight.",
  description: "Long description",
  price_cents: 18500,
  currency: "USD",
  stripe_price_id: null,
  image_urls: ["/product/blade-hoodie-onyx.svg"],
  category: "apparel",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  variants: [
    { id: "v1", product_id: "prod_1", size: "M", sku: "SKU-M", inventory_count: 2, position: 10 },
  ],
};

describe("videoSchema", () => {
  it("emits a VideoObject with the fields Google requires", () => {
    const schema = videoSchema(video, "/watch/youtube/abc");
    expect(schema).not.toBeNull();
    expect(schema).toMatchObject({
      "@type": "VideoObject",
      name: "A video",
      uploadDate: "2026-05-01T10:00:00Z",
      contentUrl: "https://www.youtube.com/watch?v=abc",
    });
  });

  it("encodes duration as ISO 8601, not as seconds", () => {
    expect(videoSchema(video, "/x")?.duration).toBe("PT1H2M3S");
    expect(videoSchema({ ...video, duration_seconds: 45 }, "/x")?.duration).toBe("PT45S");
  });

  it("omits duration rather than emitting PT0S for an unknown length", () => {
    expect(videoSchema({ ...video, duration_seconds: null }, "/x")?.duration).toBeUndefined();
  });

  it("returns null without an upload date instead of inventing one", () => {
    expect(videoSchema({ ...video, published_at: null }, "/x")).toBeNull();
  });

  it("omits the view counter when there is no count", () => {
    expect(
      videoSchema({ ...video, view_count: null }, "/x")?.interactionStatistic
    ).toBeUndefined();
  });
});

describe("productSchema", () => {
  it("prices as a decimal string, which Offer requires", () => {
    const schema = productSchema(product);
    expect(schema.offers).toMatchObject({ price: "185.00", priceCurrency: "USD" });
  });

  it("reports availability from real stock", () => {
    expect(productSchema(product).offers.availability).toBe("https://schema.org/InStock");
    const soldOut = { ...product, variants: [{ ...product.variants[0], inventory_count: 0 }] };
    expect(productSchema(soldOut).offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("makes relative image paths absolute so the crawler can fetch them", () => {
    expect(productSchema(product).image[0]).toMatch(/^https?:\/\/.+\/product\//);
  });
});

describe("dropEventSchema", () => {
  const drop: Drop = {
    id: "d1",
    slug: "drop-01",
    name: "DROP 01",
    description: "The first one.",
    hero_image_url: null,
    drops_at: "2026-07-01T18:00:00Z",
    ends_at: "2026-07-08T18:00:00Z",
    product_ids: [],
    published: true,
  };

  it("emits an Event with a start and an online location", () => {
    expect(dropEventSchema(drop)).toMatchObject({
      "@type": "Event",
      startDate: "2026-07-01T18:00:00Z",
      endDate: "2026-07-08T18:00:00Z",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    });
  });

  it("omits endDate for an open-ended drop", () => {
    expect(dropEventSchema({ ...drop, ends_at: null }).endDate).toBeUndefined();
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from one and resolves absolute items", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Store", path: "/shop" },
    ]);
    expect(schema.itemListElement[0]).toMatchObject({ position: 1, name: "Home" });
    expect(schema.itemListElement[1].item).toMatch(/\/shop$/);
  });
});

describe("personSchema", () => {
  it("carries every profile in sameAs so the entity resolves", () => {
    const schema = personSchema();
    expect(schema.sameAs.length).toBeGreaterThanOrEqual(5);
    expect(schema.sameAs.some((u) => u.includes("twitch.tv"))).toBe(true);
    expect(schema.sameAs.some((u) => u.includes("youtube.com"))).toBe(true);
  });
});
