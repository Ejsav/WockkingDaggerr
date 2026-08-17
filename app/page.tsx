import Link from "next/link";
import Hero from "@/components/sections/Hero";
import VideoCard from "@/components/VideoCard";
import ProductCard from "@/components/ProductCard";
import DropCountdown from "@/components/DropCountdown";
import LiveBanner from "@/components/LiveBanner";
import StreamSchedule from "@/components/sections/StreamSchedule";
import AboutSection from "@/components/sections/AboutSection";
import SocialSection from "@/components/sections/SocialSection";
import { autoSyncYouTube, autoSyncTwitch } from "@/lib/auto-sync";
import { getCachedPosts } from "@/lib/post-cache";
import { getActiveProducts, getNextDrop } from "@/lib/mock-data";

// Required for top-level await and server-side Node.js APIs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auto-sync YouTube + Twitch VODs on first server render if credentials exist
await Promise.all([autoSyncYouTube(), autoSyncTwitch()]);

export default function HomePage() {
  // Only show YouTube posts in the Watch strip — TikTok + Instagram go in SocialSection
  const posts = getCachedPosts()
    .filter((p) => p.platform === "youtube")
    .slice(0, 6);
  const products = getActiveProducts().slice(0, 4);
  const nextDrop = getNextDrop();

  return (
    <>
      <LiveBanner />
      <Hero />

      {/* NEXT DROP BANNER */}
      {nextDrop && (
        <section className="relative overflow-hidden border-b border-white/10 bg-ink-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.15),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1600px] gap-10 px-5 py-20 md:grid-cols-12 md:gap-16 md:px-10 md:py-32">
            <div className="md:col-span-7">
              <p className="eyebrow-blade mb-5">NEXT DROP</p>
              <h2 className="display text-[clamp(2.5rem,7vw,6rem)] text-bone">
                {nextDrop.name}
              </h2>
              <p className="mt-8 max-w-xl text-base text-bone/70 md:text-lg">
                {nextDrop.description}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/drops" className="btn-blade">VIEW DROP →</Link>
                <Link href="#signup" className="btn-bone">GET EARLY ACCESS</Link>
              </div>
            </div>
            <div className="md:col-span-5 md:pl-10">
              <p className="eyebrow mb-5">COUNTDOWN</p>
              <DropCountdown targetIso={nextDrop.drops_at} />
              <p className="mt-6 font-mono text-xs uppercase tracking-widest text-bone/40">
                ━━ Doors open at zero
              </p>
            </div>
          </div>
        </section>
      )}

      <StreamSchedule />

      {/* SHOP STRIP */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow-blade mb-3">THE STORE</p>
              <h2 className="display text-5xl md:text-7xl">STANDARD <br />ISSUE.</h2>
            </div>
            <Link href="/shop" className="font-mono text-xs uppercase tracking-widest text-bone/70 transition-colors hover:text-blade">
              SEE ALL PRODUCTS →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* WATCH STRIP — YouTube archive preview */}
      <section className="border-b border-white/10 bg-ink-800/40">
        <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow-blade mb-3">THE ARCHIVE</p>
              <h2 className="display text-5xl md:text-7xl">EVERYTHING <br />ON RECORD.</h2>
            </div>
            <Link href="/watch" className="font-mono text-xs uppercase tracking-widest text-bone/70 transition-colors hover:text-blade">
              ENTER ARCHIVE →
            </Link>
          </div>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {posts.map((p, i) => <VideoCard key={p.id} post={p} priority={i < 3} />)}
            </div>
          ) : (
            <div className="border border-white/10 bg-ink-800/50 py-20 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-bone/40">
                The vault&apos;s syncing. Fresh footage lands here first.
              </p>
              <Link
                href="https://youtube.com/@wockkingdaggerr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block font-mono text-[10px] uppercase tracking-widest text-blade transition-opacity hover:opacity-70"
              >
                Watch on YouTube →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SOCIAL SECTION — TikTok + Instagram */}
      <SocialSection />

      <AboutSection />

      {/* MANIFESTO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-32">
          <p className="eyebrow-blade mb-6">━━ MANIFESTO</p>
          <h2 className="display text-[clamp(2.5rem,8vw,7.5rem)] leading-[0.95] text-bone">
            NO FILLER. <br />NO FILTER. <br /><span className="text-blade">JUST WORK.</span>
          </h2>
          <p className="mt-12 max-w-2xl text-base text-bone/60 md:text-lg">
            This isn&apos;t a store. This isn&apos;t a channel. This isn&apos;t a brand pretending to be a culture.
            It&apos;s the record. Every drop, every film, every print, every word, is documented here.
            If it&apos;s not on this site, it&apos;s not part of the work.
          </p>
        </div>
      </section>
    </>
  );
}
