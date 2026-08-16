"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { WD } from "@/lib/wockkingdagger";
import {
  FEATURED_TIKTOKS,
  FEATURED_INSTAGRAM_POSTS,
  hasFeaturedTikToks,
  hasFeaturedInstagramPosts,
} from "@/lib/featured-content";

// Dynamic imports to avoid SSR issues with embed scripts
const TikTokEmbed = dynamic(() => import("@/components/media/TikTokEmbed"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center border border-white/5 bg-ink-700" style={{ height: "560px" }}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-bone/30 animate-pulse">
        Loading content...
      </span>
    </div>
  ),
});

const InstagramEmbed = dynamic(() => import("@/components/media/InstagramEmbed"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center border border-white/5 bg-ink-700" style={{ height: "560px" }}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-bone/30 animate-pulse">
        Loading content...
      </span>
    </div>
  ),
});

// ============================================================
// SOCIAL SECTION
// TikTok + Instagram in a unified, polished creator section.
// Shows official embeds when featured content is configured,
// shows polished CTAs when not — never looks empty or broken.
// ============================================================

export default function SocialSection() {
  const hasTikTok = hasFeaturedTikToks();
  const hasInstagram = hasFeaturedInstagramPosts();

  return (
    <section className="relative border-b border-white/10 overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(200,16,46,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,162,74,0.04),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        {/* Section header */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow-blade mb-3">━━ FOLLOW THE WORK</p>
            <h2 className="display text-5xl md:text-7xl">
              SOCIAL<br />
              <span className="text-blade">DROPS.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-bone/55 leading-relaxed">
            Short-form content, behind-the-scenes, and unfiltered moments across TikTok and Instagram.
          </p>
        </div>

        {/* Platform columns */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* ── TIKTOK ── */}
          <div className="group flex flex-col gap-0 border border-white/[0.07] bg-ink-800/30">
            {/* Platform header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <div className="flex items-center gap-3">
                <TikTokIcon className="h-5 w-5 text-bone" />
                <div>
                  <p className="font-display text-sm uppercase tracking-wide text-bone">TikTok</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45">
                    {WD.tiktok.handle}
                  </p>
                </div>
              </div>
              <a
                href={WD.tiktok.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone/55 transition-all hover:border-blade hover:text-blade"
              >
                Follow
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            </div>

            {/* Content area */}
            <div className="flex-1 p-5">
              {hasTikTok ? (
                <div className="space-y-4">
                  {FEATURED_TIKTOKS.slice(0, 1).map((video) => (
                    <TikTokEmbed key={video.videoId} videoId={video.videoId} />
                  ))}
                  {FEATURED_TIKTOKS.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {FEATURED_TIKTOKS.slice(1, 5).map((video) => (
                        <a
                          key={video.videoId}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-2 border border-white/5 bg-ink-700 p-5 text-center transition-colors hover:border-blade/30"
                          style={{ minHeight: "120px" }}
                        >
                          <TikTokIcon className="h-6 w-6 text-blade/40" />
                          <span className="font-mono text-[9px] uppercase tracking-widest text-bone/45">
                            {video.caption ?? "View video →"}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <TikTokFallback />
              )}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-white/[0.07] px-6 py-4">
              <a
                href={WD.tiktok.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/40 transition-colors hover:text-blade"
              >
                <span>See all videos on TikTok</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* ── INSTAGRAM ── */}
          <div className="group flex flex-col gap-0 border border-white/[0.07] bg-ink-800/30">
            {/* Platform header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <div className="flex items-center gap-3">
                <InstagramIcon className="h-5 w-5 text-bone" />
                <div>
                  <p className="font-display text-sm uppercase tracking-wide text-bone">Instagram</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45">
                    {WD.instagram.handle}
                  </p>
                </div>
              </div>
              <a
                href={WD.instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone/55 transition-all hover:border-blade hover:text-blade"
              >
                Follow
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            </div>

            {/* Content area */}
            <div className="flex-1 p-5">
              {hasInstagram ? (
                <div className="space-y-4">
                  {FEATURED_INSTAGRAM_POSTS.slice(0, 1).map((post) => (
                    <InstagramEmbed
                      key={post.shortcode}
                      shortcode={post.shortcode}
                      caption={post.caption}
                    />
                  ))}
                  {FEATURED_INSTAGRAM_POSTS.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {FEATURED_INSTAGRAM_POSTS.slice(1, 3).map((post) => (
                        <a
                          key={post.shortcode}
                          href={`https://www.instagram.com/p/${post.shortcode}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-2 border border-white/5 bg-ink-700 p-5 text-center transition-colors hover:border-blade/30"
                          style={{ minHeight: "120px" }}
                        >
                          <InstagramIcon className="h-6 w-6 text-blade/40" />
                          <span className="font-mono text-[9px] uppercase tracking-widest text-bone/45">
                            {post.caption ?? "View post →"}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <InstagramFallback />
              )}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-white/[0.07] px-6 py-4">
              <a
                href={WD.instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/40 transition-colors hover:text-blade"
              >
                <span>See all posts on Instagram</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom strip — cross-platform CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone/35">
              NEW CONTENT DROPPING REGULARLY
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-bone/20">
              Follow on all platforms to catch it live
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={WD.tiktok.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-bone/50 transition-all hover:border-blade/50 hover:text-bone"
            >
              <TikTokIcon className="h-3.5 w-3.5" />
              TikTok
            </a>
            <a
              href={WD.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-bone/50 transition-all hover:border-blade/50 hover:text-bone"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              Instagram
            </a>
            <a
              href={WD.twitch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-bone/50 transition-all hover:border-blade/50 hover:text-bone"
            >
              <TwitchIcon className="h-3.5 w-3.5" />
              Twitch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FALLBACK STATES ──────────────────────────────────────────

function TikTokFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 border border-white/5 bg-ink-700/60 px-8 py-14 text-center">
      {/* Large TikTok mark */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-blade/20 animate-pulse" />
        <TikTokIcon className="h-9 w-9 text-bone/70" />
      </div>

      <div>
        <p className="font-display text-2xl uppercase text-bone md:text-3xl">
          Short-form content.
        </p>
        <p className="mt-3 max-w-xs text-sm text-bone/50 leading-relaxed">
          Raw clips, studio moments, and drops in real time.
          Follow on TikTok to catch everything as it lands.
        </p>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <a
          href={WD.tiktok.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-blade w-full flex items-center justify-center gap-2"
        >
          <TikTokIcon className="h-4 w-4" />
          FOLLOW {WD.tiktok.handle}
        </a>
        <p className="font-mono text-[9px] uppercase tracking-widest text-bone/25">
          Latest social drops are live on the platform
        </p>
      </div>

      {/* Stat strip */}
      <div className="flex w-full items-center justify-center gap-8 border-t border-white/5 pt-6">
        <div className="text-center">
          <p className="font-display text-2xl text-bone">LIVE</p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-bone/35">On TikTok</p>
        </div>
        <div className="h-8 w-px bg-white/10" aria-hidden />
        <div className="text-center">
          <p className="font-display text-2xl text-bone">DAILY</p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-bone/35">Content drops</p>
        </div>
      </div>
    </div>
  );
}

function InstagramFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 border border-white/5 bg-ink-700/60 px-8 py-14 text-center">
      {/* Large Instagram mark */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-gold/20 animate-pulse" />
        <InstagramIcon className="h-9 w-9 text-bone/70" />
      </div>

      <div>
        <p className="font-display text-2xl uppercase text-bone md:text-3xl">
          Behind the work.
        </p>
        <p className="mt-3 max-w-xs text-sm text-bone/50 leading-relaxed">
          Editorial shots, drop previews, and studio documentation.
          Follow on Instagram for the full visual record.
        </p>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <a
          href={WD.instagram.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-blade w-full flex items-center justify-center gap-2"
        >
          <InstagramIcon className="h-4 w-4" />
          FOLLOW {WD.instagram.handle}
        </a>
        <p className="font-mono text-[9px] uppercase tracking-widest text-bone/25">
          Drops, previews, and behind-the-scenes
        </p>
      </div>

      {/* Visual placeholder grid */}
      <div className="grid w-full grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square border border-white/5 bg-ink-800"
            style={{
              opacity: 0.3 + i * 0.08,
              background: `linear-gradient(${135 + i * 22}deg, #1a1a1a, #0a0a0a)`,
            }}
          />
        ))}
      </div>

      <p className="font-mono text-[9px] uppercase tracking-widest text-bone/20">
        Latest posts visible on Instagram
      </p>
    </div>
  );
}

// ── INLINE ICONS ──────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}
