import { WD } from "@/lib/wockkingdagger";

// ------------------------------------------------------------
// ABOUT SECTION
// Tells the WockkingDagger story in under 10 seconds.
// Dark, direct, confident. Not a bio page. Not a press kit.
// ------------------------------------------------------------

export default function AboutSection() {
  return (
    <section className="relative border-b border-white/10 overflow-hidden">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,16,46,0.1),transparent_55%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blade/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16 lg:gap-24">

          {/* Left — identity statement */}
          <div className="md:col-span-5">
            <p className="eyebrow-blade mb-5">━━ WHO IS THIS</p>
            <h2 className="display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.9] text-bone">
              WOCKKING<br />
              <span className="text-blade">DAGGER.</span>
            </h2>
            <div className="mt-8 space-y-4 text-base text-bone/65 leading-relaxed">
              <p>
                Streamer. Creator. Builder. Started with a camera and an internet connection —
                built a following on raw content, no algorithm tricks, no manufactured moments.
              </p>
              <p>
                The channel is the record. The drops are the proof. The streams are the work.
                Nothing here is packaged for easy consumption.
              </p>
            </div>

            {/* Platform handles strip */}
            <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="font-display text-xl text-bone">TWITCH</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45 mt-1">
                  {WD.twitch.channelLogin}
                </p>
              </div>
              <div>
                <p className="font-display text-xl text-bone">TIKTOK</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45 mt-1">
                  {WD.tiktok.handle}
                </p>
              </div>
              <div>
                <p className="font-display text-xl text-bone">INSTAGRAM</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45 mt-1">
                  {WD.instagram.handle}
                </p>
              </div>
              <div>
                <p className="font-display text-xl text-bone">YOUTUBE</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-bone/45 mt-1">
                  {WD.youtube.handleMain}
                </p>
              </div>
            </div>
          </div>

          {/* Right — pillars + links */}
          <div className="md:col-span-7">
            <div className="grid gap-px border border-white/[0.06] sm:grid-cols-2">
              {[
                {
                  label: "STREAMING",
                  desc: "Live on Twitch and Kick. Game nights, IRL content, unfiltered. The stream shows up exactly as it is.",
                  href: WD.twitch.url,
                  cta: "Watch live",
                },
                {
                  label: "CONTENT",
                  desc: "YouTube archive covering everything from studio diaries to long-form breakdowns. Built for replay.",
                  href: WD.youtube.urlMain,
                  cta: "The archive",
                },
                {
                  label: "SHORT FORM",
                  desc: "TikTok and Instagram for the unfiltered moments, drop previews, and behind-the-scenes content.",
                  href: WD.tiktok.profileUrl,
                  cta: "TikTok →",
                },
                {
                  label: "DROPS",
                  desc: "Limited releases. Real product, real runs. Every piece is documented here and ships in 48 hours.",
                  href: "/drops",
                  cta: "See drops",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group flex flex-col justify-between border border-white/[0.06] bg-ink-800/40 p-6 transition-colors hover:bg-ink-800/70 md:p-7"
                >
                  <div>
                    <p className="eyebrow-blade mb-3">{item.label}</p>
                    <p className="text-sm leading-relaxed text-bone/60">{item.desc}</p>
                  </div>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone/50 transition-colors group-hover:text-blade"
                  >
                    {item.cta}
                    <span>→</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
