import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WockkingDagger — Official Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Crimson radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.28) 0%, transparent 70%)",
          }}
        />

        {/* Diagonal slash line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, transparent 65%, rgba(200,16,46,0.06) 100%)",
          }}
        />

        {/* Blade mark */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "80px",
            display: "flex",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#c8102e">
            <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c8102e",
            marginBottom: "20px",
          }}
        >
          ━━ THE OFFICIAL HUB
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: "120px",
            lineHeight: 0.88,
            textTransform: "uppercase",
            color: "#f5f1ea",
            letterSpacing: "-2px",
            marginBottom: "32px",
          }}
        >
          WOCKKING<span style={{ color: "#c8102e" }}>DAGGER</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(245,241,234,0.5)",
          }}
        >
          RELEASES · DROPS · ARCHIVE · STORE · LIVE STREAMS
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#c8102e",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
