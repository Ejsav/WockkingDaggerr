/** @type {import('next').NextConfig} */

// Security headers applied to every response. The CSP is deliberately
// explicit about the third parties this site actually needs — the video
// platforms it embeds and Stripe — and nothing else.
const CSP = [
  "default-src 'self'",
  // Next.js inlines a small bootstrap script; 'unsafe-inline' is required
  // for it, and Stripe's script is loaded on the hosted checkout, not here.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.ytimg.com https://static-cdn.jtvnw.net https://*.jtvnw.net https://*.cdninstagram.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://*.supabase.co",
  "font-src 'self' data:",
  "media-src 'self' https:",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://va.vercel-scripts.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.twitch.tv https://www.tiktok.com https://www.instagram.com https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Modern formats first; Next negotiates per request.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      { protocol: "https", hostname: "*.jtvnw.net" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "*.tiktokcdn-us.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Thumbnails change rarely; a long cache keeps the optimizer cheap.
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // Fingerprinted build output is safe to cache forever.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

module.exports = nextConfig;
