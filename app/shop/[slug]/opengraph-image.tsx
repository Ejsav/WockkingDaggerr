import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils";
import { isSoldOut } from "@/types";

// Node runtime: the catalog read reaches Supabase, which the edge
// runtime cannot do through the server-only client.
export const runtime = "nodejs";
export const alt = "WockkingDagger — Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const heading = product?.name ?? "WOCKKINGDAGGER";
  const price = product ? formatPrice(product.price_cents, product.currency) : null;
  const status = product ? (isSoldOut(product) ? "SOLD OUT" : "AVAILABLE NOW") : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 760,
            height: 760,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.30) 0%, rgba(200,16,46,0) 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: 8,
            color: "#e8556b",
            textTransform: "uppercase",
          }}
        >
          {product ? "The Store" : "Official Hub"}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: heading.length > 24 ? 76 : 104,
            lineHeight: 1,
            fontWeight: 900,
            color: "#f5f1ea",
            textTransform: "uppercase",
            letterSpacing: -2,
          }}
        >
          {heading}
        </div>
        {price && (
          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 32,
              fontFamily: "monospace",
              fontSize: 26,
              letterSpacing: 4,
              color: "#f5f1ea",
            }}
          >
            <span>{price}</span>
            <span style={{ color: status === "SOLD OUT" ? "#8d8a85" : "#e8556b" }}>{status}</span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 72,
            display: "flex",
            fontFamily: "monospace",
            fontSize: 18,
            letterSpacing: 6,
            color: "rgba(245,241,234,0.45)",
          }}
        >
          WOCKKINGDAGGER
        </div>
      </div>
    ),
    size
  );
}
