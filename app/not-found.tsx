import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center px-5 pt-32 text-center md:px-10">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.1),transparent_60%)]" />

      <div className="relative z-10 max-w-3xl">
        <p className="eyebrow-blade mb-6">━━ 404 — OFF THE MAP</p>

        <h1 className="display text-[clamp(6rem,20vw,18rem)] leading-[0.85] text-bone">
          CUT.
        </h1>

        <p className="mt-8 text-balance text-base text-bone/60 md:text-lg">
          You went somewhere you definitely weren&apos;t supposed to.
          Whatever was here didn&apos;t make the final edit — or it never existed.
          Either way, the good stuff is one click back.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-blade">
            BACK TO THE HUB →
          </Link>
          <Link href="/watch" className="btn-bone">
            RAID THE ARCHIVE
          </Link>
        </div>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-widest text-bone/25">
          WOCKKINGDAGGER — IF IT&apos;S NOT HERE, IT&apos;S NOT REAL
        </p>
      </div>
    </section>
  );
}
