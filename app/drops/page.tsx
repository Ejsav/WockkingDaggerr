import Link from "next/link";
import DropCountdown from "@/components/DropCountdown";
import ProductCard from "@/components/ProductCard";
import { getAllDrops, getProductById, computeDropStatus } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function DropsPage() {
  const drops = getAllDrops().map((d) => ({ ...d, status: computeDropStatus(d) }));
  const upcoming = drops.find((d) => d.status === "upcoming");
  const live = drops.find((d) => d.status === "live");
  const ended = drops.filter((d) => d.status === "ended");

  return (
    <>
      <section className="border-b border-white/10 pt-40 md:pt-48">
        <div className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-24">
          <p className="eyebrow-blade mb-5">━━ DROP CALENDAR</p>
          <h1 className="display text-[clamp(3rem,12vw,10rem)] leading-[0.85] text-bone">
            DROPS. <br />
            <span className="text-blade">EVERY ONE.</span>
          </h1>
          <p className="mt-8 max-w-xl text-bone/60 md:text-lg">
            Scheduled releases. When the timer hits zero, the door opens. When stock runs out, the
            door closes. Nothing comes back.
          </p>
        </div>
      </section>

      {/* UPCOMING */}
      {upcoming && (
        <section className="relative overflow-hidden border-b border-white/10 bg-ink-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,16,46,0.18),transparent_60%)]" />
          <div className="relative mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
            <p className="eyebrow-blade mb-5">UPCOMING</p>
            <div className="grid gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-7">
                <h2 className="display text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] text-bone">
                  {upcoming.name}
                </h2>
                <p className="mt-8 max-w-2xl text-bone/70 md:text-lg">{upcoming.description}</p>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-bone/40">
                  DROPS — {formatDate(upcoming.drops_at)}
                  {upcoming.ends_at && ` · CLOSES ${formatDate(upcoming.ends_at)}`}
                </p>
              </div>
              <div className="md:col-span-5 md:pt-2">
                <p className="eyebrow mb-5">DOORS OPEN IN</p>
                <DropCountdown targetIso={upcoming.drops_at} />
              </div>
            </div>

            {upcoming.product_ids.length > 0 && (
              <div className="mt-16 border-t border-white/10 pt-10">
                <p className="eyebrow mb-6">PIECES IN THIS DROP</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                  {upcoming.product_ids
                    .map((id) => getProductById(id))
                    .filter(Boolean)
                    .map((p) => (
                      <ProductCard key={p!.id} product={p!} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* LIVE */}
      {live && (
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow-blade mb-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 animate-pulse_blade rounded-full bg-blade" />
                  LIVE NOW
                </p>
                <h2 className="display text-4xl md:text-6xl">{live.name}</h2>
                <p className="mt-4 max-w-xl text-bone/60">{live.description}</p>
              </div>
              <Link href="/shop" className="btn-blade">
                SHOP THE DROP →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {live.product_ids
                .map((id) => getProductById(id))
                .filter(Boolean)
                .map((p) => (
                  <ProductCard key={p!.id} product={p!} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ENDED ARCHIVE */}
      {ended.length > 0 && (
        <section>
          <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
            <p className="eyebrow mb-3">━━ ARCHIVED DROPS</p>
            <h2 className="display text-4xl md:text-6xl">CLOSED VAULT.</h2>
            <p className="mt-4 max-w-xl text-bone/60">
              Past drops, documented. Stock is gone, but the work stays on record.
            </p>

            <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {ended.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="font-display text-3xl uppercase tracking-tight text-bone md:text-4xl">
                      {d.name}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-bone/50">{d.description}</p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
                    {formatDate(d.drops_at)}
                    {d.ends_at ? ` — ${formatDate(d.ends_at)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
