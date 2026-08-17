import { describe, expect, it } from "vitest";
import { cartSchema, MAX_QUANTITY_PER_LINE } from "@/lib/commerce";

// The cart schema is the boundary between a browser and money. Everything
// here is an input a hostile client can actually send.

describe("cartSchema", () => {
  const line = { product_id: "prod_1", variant_id: "var_1", quantity: 1 };

  it("accepts a well-formed cart", () => {
    expect(cartSchema.safeParse({ lines: [line] }).success).toBe(true);
  });

  it("rejects an empty cart", () => {
    expect(cartSchema.safeParse({ lines: [] }).success).toBe(false);
  });

  it("rejects a client-supplied price — the server resolves prices, always", () => {
    const parsed = cartSchema.parse({
      lines: [{ ...line, unit_price_cents: 1, price: 0.01 }],
    });
    expect(parsed.lines[0]).not.toHaveProperty("unit_price_cents");
    expect(parsed.lines[0]).not.toHaveProperty("price");
  });

  it("rejects zero, negative and fractional quantities", () => {
    for (const quantity of [0, -1, -100, 1.5]) {
      expect(cartSchema.safeParse({ lines: [{ ...line, quantity }] }).success).toBe(false);
    }
  });

  it("caps the per-line quantity so one request cannot drain a size", () => {
    expect(
      cartSchema.safeParse({ lines: [{ ...line, quantity: MAX_QUANTITY_PER_LINE }] }).success
    ).toBe(true);
    expect(
      cartSchema.safeParse({ lines: [{ ...line, quantity: MAX_QUANTITY_PER_LINE + 1 }] }).success
    ).toBe(false);
    expect(cartSchema.safeParse({ lines: [{ ...line, quantity: 1e9 }] }).success).toBe(false);
  });

  it("caps the number of lines", () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ ...line, variant_id: `v${i}` }));
    expect(cartSchema.safeParse({ lines: many }).success).toBe(false);
  });

  it("rejects oversized identifiers used to probe the database", () => {
    expect(
      cartSchema.safeParse({ lines: [{ ...line, variant_id: "x".repeat(500) }] }).success
    ).toBe(false);
  });

  it("rejects non-string identifiers and missing fields", () => {
    expect(cartSchema.safeParse({ lines: [{ ...line, variant_id: 42 }] }).success).toBe(false);
    expect(cartSchema.safeParse({ lines: [{ product_id: "p", quantity: 1 }] }).success).toBe(false);
    expect(cartSchema.safeParse({ lines: [{ ...line, variant_id: "" }] }).success).toBe(false);
  });

  it("rejects a payload that is not an object with lines", () => {
    expect(cartSchema.safeParse(null).success).toBe(false);
    expect(cartSchema.safeParse([line]).success).toBe(false);
    expect(cartSchema.safeParse({ lines: "everything" }).success).toBe(false);
  });
});
