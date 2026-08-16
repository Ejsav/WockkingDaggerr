import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export const runtime = "edge";
export const alt = "WockkingDagger — Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ProductOGImage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
          <span style={{ color: "#f5f1ea", fontSize: "72px", fontFamily: "sans-serif", fontWeight: 900, textTransform: "uppercase" }}>
            WOCKKINGDAGGER
          </span>
        </div>
      ),
      { ...size }
    );
  }

  const isVeryLow = product.inventory_count !== null && product.inventory_count < 10;
  const isLow = product.inventory_count !== null && product.inventory_count < 20;
  const price = formatPrice(product.price_cents, product.currency);

  // Has a real product image (not placeholder SVG)?
  const hasProductImg = product.image_urls?.[0] &&
    !product.image_urls[0].startsWith("/placeholders");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Product image — left half */}
        {hasProductImg ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: "560px", height: "100%", display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_urls[0]}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 40%, rgba(10,10,10,0.95) 90%, #0a0a0a 100%)" }} />
          </div>
        ) : (
          /* Pattern fill when no product image */
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "560px",
              height: "100%",
              background: "#121212",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="rgba(200,16,46,0.2)">
              <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
            </svg>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 40%, #0a0a0a 100%)" }} />
          </div>
        )}

        {/* Crimson glow */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Right panel */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "680px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 60px",
          }}
        >
          {/* Top — logo + category */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#c8102e">
                <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
              </svg>
              <span style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "17px", color: "#f5f1ea", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                WOCKKINGDAGGER
              </span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(245,241,234,0.45)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              {product.category.toUpperCase()}
            </span>
          </div>

          {/* Middle — product name + price */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Stock warning */}
            {isVeryLow && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8102e" }} />
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#c8102e", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  ONLY {product.inventory_count} LEFT
                </span>
              </div>
            )}
            {isLow && !isVeryLow && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a24a" }} />
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#c9a24a", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  LOW STOCK
                </span>
              </div>
            )}

            <div
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: product.name.length > 25 ? "44px" : "56px",
                lineHeight: 1.0,
                color: "#f5f1ea",
                textTransform: "uppercase",
                letterSpacing: "-0.5px",
                maxWidth: "560px",
              }}
            >
              {product.name}
            </div>

            {product.tagline && (
              <div style={{ fontFamily: "sans-serif", fontSize: "18px", color: "rgba(245,241,234,0.55)", maxWidth: "500px" }}>
                {product.tagline}
              </div>
            )}

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
              <span style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "52px", color: "#f5f1ea", letterSpacing: "-1px" }}>
                {price}
              </span>
              {product.inventory_count !== null && !isLow && (
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(245,241,234,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {product.inventory_count} IN STOCK
                </span>
              )}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "1px", background: "#c8102e" }} />
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(245,241,234,0.4)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              SHIPS WITHIN 48 HOURS
            </span>
          </div>
        </div>

        {/* Bottom crimson bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "#c8102e" }} />
      </div>
    ),
    { ...size }
  );
}
