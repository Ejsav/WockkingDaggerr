import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden border-b border-white/10 pt-32">
      {/* Background — layered gradients + grain (grain is in body) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,16,46,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,162,74,0.07),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* Marquee strip at top of hero */}
      <div className="absolute left-0 right-0 top-[68px] overflow-hidden md:top-24 border-y border-white/5 py-3">
        <div className="flex animate-marquee whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-bone/40">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex">
              <span className="px-8">FREE SHIPPING ON DROPS OVER $150</span>
              <span className="px-8 text-blade">●</span>
              <span className="px-8">DROP 03 — VAULT IN 3 DAYS</span>
              <span className="px-8 text-blade">●</span>
              <span className="px-8">EVERY ORDER SHIPS WITHIN 48 HOURS</span>
              <span className="px-8 text-blade">●</span>
              <span className="px-8">NEW ARCHIVE FOOTAGE LIVE</span>
              <span className="px-8 text-blade">●</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="reveal max-w-5xl">
          <p
            className="eyebrow-blade mb-6"
            style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
          >
            ━━ THE OFFICIAL HUB ━━
          </p>
          <h1
            className="display text-[clamp(3.5rem,12vw,11rem)] leading-[0.85] text-bone"
            style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            BUILT <br />
            <span className="text-blade">SHARP.</span> <br />
            SHIPPED <br />
            HARD.
          </h1>

          <div
            className="mt-10 max-w-xl text-base text-bone/70 md:text-lg"
            style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
          >
            <p>
              Releases, drops, video archive, and the store. One place. No middlemen, no algorithm
              dependency. If it&apos;s here, it&apos;s official.
            </p>
          </div>

          <div
            className="mt-10 flex flex-wrap items-center gap-4"
            style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s both" }}
          >
            <Link href="/drops" className="btn-blade">
              SEE THE NEXT DROP →
            </Link>
            <Link href="/watch" className="btn-bone">
              ENTER THE ARCHIVE
            </Link>
          </div>
        </div>

        {/* Bottom data strip */}
        <div
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 md:mt-16 md:grid-cols-4 md:gap-x-8 md:gap-y-6 md:pt-8"
          style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.75s both" }}
        >
          <Stat label="DROPS LIVE" value="03" />
          <Stat label="ARCHIVE" value="48+" />
          <Stat label="SHIPS WORLDWIDE" value="USA / EU / UK" />
          <Stat label="STATUS" value="ALWAYS BUILDING" accent />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <p
        className={`font-display text-3xl md:text-4xl ${
          accent ? "text-blade animate-pulse_blade" : "text-bone"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
