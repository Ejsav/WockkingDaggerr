import { ImageResponse } from "next/og";
import { WD } from "@/lib/wockkingdagger";

// Satori (the renderer behind ImageResponse) has no block layout: any
// element with more than one child needs an explicit display value.
export const alt = `${WD.displayName} — Official Hub`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
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
            top: -180,
            right: -140,
            width: 780,
            height: 780,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.32) 0%, rgba(200,16,46,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 72,
            display: "flex",
            fontFamily: "monospace",
            fontSize: 20,
            letterSpacing: 8,
            color: "#e8556b",
            textTransform: "uppercase",
          }}
        >
          Official Hub
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -3,
            color: "#f5f1ea",
            textTransform: "uppercase",
          }}
        >
          Wockking
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -3,
            color: "#c8102e",
            textTransform: "uppercase",
          }}
        >
          Dagger
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontFamily: "monospace",
            fontSize: 24,
            letterSpacing: 6,
            color: "rgba(245,241,234,0.62)",
            textTransform: "uppercase",
          }}
        >
          Streams · Archive · Drops · Store
        </div>
      </div>
    ),
    size
  );
}
