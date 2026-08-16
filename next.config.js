/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // YouTube thumbnails — i.ytimg.com is the correct CDN for all YT thumbs
      { protocol: "https", hostname: "i.ytimg.com" },
      // Instagram CDN patterns
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      // TikTok CDN patterns
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      // Supabase storage
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

module.exports = nextConfig;
