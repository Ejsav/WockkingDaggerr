import { SOCIALS } from "@/lib/socials";

// ------------------------------------------------------------
// STREAM SCHEDULE
// Update SCHEDULE_DAYS and NEXT_STREAM to match real schedule.
// Times shown in Eastern — add timezone note if audience is global.
// ------------------------------------------------------------

const SCHEDULE_DAYS = [
  { day: "MON", time: null, note: "OFF" },
  { day: "TUE", time: "8PM ET", note: "LIVE" },
  { day: "WED", time: "8PM ET", note: "LIVE" },
  { day: "THU", time: null, note: "OFF" },
  { day: "FRI", time: "9PM ET", note: "LIVE" },
  { day: "SAT", time: "7PM ET", note: "LIVE" },
  { day: "SUN", time: "6PM ET", note: "LIVE" },
] as const;

const STREAM_PLATFORMS = [
  { label: "TWITCH", url: SOCIALS.twitch.url, primary: true },
  { label: "KICK", url: SOCIALS.kick.url, primary: false },
];

export default function StreamSchedule() {
  const liveDays = SCHEDULE_DAYS.filter((d) => d.time !== null);

  return (
    <section className="border-b border-white/10 bg-ink-800/60">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">

          {/* Left — headline */}
          <div className="md:col-span-5">
            <p className="eyebrow-blade mb-5">━━ WHEN WE GO LIVE</p>
            <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.9] text-bone">
              CATCH IT<br />
              <span className="text-blade">LIVE.</span>
            </h2>
            <p className="mt-8 max-w-sm text-bone/60">
              Streaming on Twitch and Kick. Same stream, two platforms.
              Drop in, say something, or just watch.
            </p>

            {/* Platform CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              {STREAM_PLATFORMS.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={p.primary ? "btn-blade" : "btn-bone"}
                >
                  {p.label} →
                </a>
              ))}
            </div>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-bone/35">
              ● Live detection auto-shows the stream on this site
            </p>
          </div>

          {/* Right — schedule grid */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {SCHEDULE_DAYS.map((d) => {
                const isLive = d.time !== null;
                return (
                  <div
                    key={d.day}
                    className={`flex flex-col items-center justify-center gap-1.5 border py-3 transition-colors md:py-6 ${
                      isLive
                        ? "border-blade/40 bg-blade/8 hover:bg-blade/15"
                        : "border-white/8 bg-ink-700/40"
                    }`}
                  >
                    <p
                      className={`font-mono text-[9px] font-medium uppercase tracking-widest md:text-[10px] ${
                        isLive ? "text-blade" : "text-bone/30"
                      }`}
                    >
                      {d.day}
                    </p>
                    {isLive ? (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-blade animate-pulse_blade" />
                        <p className="font-mono text-[8px] uppercase tracking-widest text-bone/70 md:text-[9px] text-center leading-snug">
                          {d.time}
                        </p>
                      </>
                    ) : (
                      <div className="h-px w-4 bg-white/15" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Schedule summary */}
            <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blade" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-bone/60">
                  {liveDays.length} DAYS / WEEK
                </p>
              </div>
              <div className="h-3 w-px bg-white/15" aria-hidden />
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone/60">
                TUE · WED · FRI · SAT · SUN
              </p>
              <div className="h-3 w-px bg-white/15" aria-hidden />
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40">
                TIMES IN ET — UPDATE IN LIB/WOCKKINGDAGGER.TS
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
