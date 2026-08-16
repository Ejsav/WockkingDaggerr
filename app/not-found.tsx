import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center px-5 pt-32 text-center md:px-10">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.1),transparent_60%)]" />

      <div className="relative z-10 max-w-3xl">
        <p className="eyebrow-blade mb-6">━━ 404</p>

        <h1 className="display text-[clamp(6rem,20vw,18rem)] leading-[0.85] text-bone">
          GONE.
        </h1>

        <p className="mt-8 text-base text-bone/60 md:text-lg">
          That page doesn&apos;t exist, was moved, or never made it past the cut.
          Nothing broken — just not here.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-blade">
            BACK TO HUB →
          </Link>
          <Link href="/watch" className="btn-bone">
            ENTER ARCHIVE
          </Link>
        </div>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-widest text-bone/25">
          WOCKKINGDAGGER — OFFICIAL HUB
        </p>
      </div>
    </section>
  );
}
