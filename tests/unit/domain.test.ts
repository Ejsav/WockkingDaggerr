import { describe, expect, it } from "vitest";
import { computeDropStatus, isSoldOut, totalInventory, type Product } from "@/types";

function product(counts: number[]): Product {
  return {
    id: "p",
    slug: "p",
    name: "P",
    tagline: null,
    description: "",
    price_cents: 1000,
    currency: "USD",
    stripe_price_id: null,
    image_urls: [],
    category: "apparel",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    variants: counts.map((inventory_count, i) => ({
      id: `v${i}`,
      product_id: "p",
      size: ["S", "M", "L"][i] ?? `S${i}`,
      sku: `SKU-${i}`,
      inventory_count,
      position: i * 10,
    })),
  };
}

describe("computeDropStatus", () => {
  const now = Date.parse("2026-06-15T12:00:00Z");

  it("is upcoming before the open time", () => {
    expect(computeDropStatus({ drops_at: "2026-06-16T00:00:00Z", ends_at: null }, now)).toBe(
      "upcoming"
    );
  });

  it("flips to live the instant the clock passes the open time", () => {
    expect(computeDropStatus({ drops_at: "2026-06-15T12:00:00Z", ends_at: null }, now)).toBe("live");
    expect(computeDropStatus({ drops_at: "2026-06-15T11:59:59Z", ends_at: null }, now)).toBe("live");
  });

  it("stays live forever when there is no close time", () => {
    expect(computeDropStatus({ drops_at: "2020-01-01T00:00:00Z", ends_at: null }, now)).toBe("live");
  });

  it("ends only after the close time, not on it", () => {
    expect(
      computeDropStatus({ drops_at: "2026-06-01T00:00:00Z", ends_at: "2026-06-15T12:00:00Z" }, now)
    ).toBe("live");
    expect(
      computeDropStatus({ drops_at: "2026-06-01T00:00:00Z", ends_at: "2026-06-15T11:59:59Z" }, now)
    ).toBe("ended");
  });

  it("falls back to upcoming on a corrupt date rather than opening the doors", () => {
    expect(computeDropStatus({ drops_at: "garbage", ends_at: null }, now)).toBe("upcoming");
  });
});

describe("inventory derivation", () => {
  it("is sold out only when every size is at zero", () => {
    expect(isSoldOut(product([0, 0, 0]))).toBe(true);
    expect(isSoldOut(product([0, 0, 1]))).toBe(false);
  });

  it("treats a product with no variants as sold out — nothing to sell", () => {
    expect(isSoldOut(product([]))).toBe(true);
  });

  it("sums only positive stock, so a negative row cannot mask real inventory", () => {
    expect(totalInventory(product([3, 4, 0]))).toBe(7);
    expect(totalInventory(product([-5, 4]))).toBe(4);
  });
});
