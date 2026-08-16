import { ImageResponse } from "next/og";
import { getCachedPosts } from "@/lib/post-cache";
import { getVisiblePosts } from "@/lib/mock-data";

export const runtime = "nodejs";
export const alt = "WockkingDagger — Video";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#c8102e",
  tiktok: "#f5f1ea",
  instagram: "#c9a24a",
};

export default async function VideoOGImage({ params }: { params: { id: string } }) {
  const posts = getCachedPosts().length > 0 ? getCachedPosts() : getVisiblePosts();
  const post = posts.find((p) => p.id === params.id);

  // Fallback to the generic hub OG if post not found
  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
          }}
        >
          <div style={{ color: "#f5f1ea", fontSize: "72px", fontFamily: "sans-serif", fontWeight: 900, textTransform: "uppercase" }}>
            WOCKKING<span style={{ color: "#c8102e" }}>DAGGER</span>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const platformColor = PLATFORM_COLORS[post.platform] ?? "#c8102e";
  const platformLabel = post.platform.toUpperCase();
  const hasThumbnail = post.thumbnail_url &&
    !post.thumbnail_url.startsWith("/") &&
    !post.thumbnail_url.startsWith("/placeholders");

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
        {/* Thumbnail — left 55% of the card */}
        {hasThumbnail && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "660px",
              height: "100%",
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail_url!}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Gradient over thumbnail so text on right reads clean */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.9) 75%, #0a0a0a 100%)",
              }}
            />
          </div>
        )}

        {/* Background crimson glow — always present */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.22) 0%, transparent 70%)",
          }}
        />

        {/* Right panel — brand + title */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: hasThumbnail ? "620px" : "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 60px",
          }}
        >
          {/* Top — logo + platform badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#c8102e">
                <path d="M12 1L7 8h3v8l-2.5 3 4.5 3 4.5-3-2.5-3V8h3L12 1z" />
              </svg>
              <span style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "18px", color: "#f5f1ea", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                WOCKKINGDAGGER
              </span>
            </div>
            <div
              style={{
                background: platformColor,
                color: post.platform === "tiktok" ? "#0a0a0a" : "#f5f1ea",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "6px 14px",
              }}
            >
              {platformLabel}
            </div>
          </div>

          {/* Middle — title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: post.title.length > 50 ? "36px" : post.title.length > 30 ? "44px" : "52px",
                lineHeight: 1.0,
                color: "#f5f1ea",
                textTransform: "uppercase",
                letterSpacing: "-0.5px",
                maxWidth: "500px",
              }}
            >
              {post.title.length > 70 ? post.title.slice(0, 68) + "…" : post.title}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {post.view_count != null && (
                <span style={{ fontFamily: "monospace", fontSize: "13px", color: "rgba(245,241,234,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {post.view_count >= 1000000
                    ? `${(post.view_count / 1000000).toFixed(1)}M VIEWS`
                    : post.view_count >= 1000
                    ? `${Math.round(post.view_count / 1000)}K VIEWS`
                    : `${post.view_count} VIEWS`}
                </span>
              )}
              {post.duration_seconds != null && post.duration_seconds > 0 && (
                <span style={{ fontFamily: "monospace", fontSize: "13px", color: "rgba(245,241,234,0.4)", letterSpacing: "0.1em" }}>
                  {Math.floor(post.duration_seconds / 60)}:{String(post.duration_seconds % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          {/* Bottom — watch CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "1px", background: "#c8102e" }} />
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(245,241,234,0.45)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              WATCH ON WOCKKINGDAGGER.COM
            </span>
          </div>
        </div>

        {/* Bottom crimson bar */}
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
    { ...size }
  );
}
