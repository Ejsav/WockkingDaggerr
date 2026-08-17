import { WD } from "@/lib/wockkingdagger";
import { formatCompactNumber } from "@/lib/utils";
import type { LiveStatus } from "@/types";

// ============================================================
// LIVE BANNER — server rendered from the live_status row.
//
// No polling. The row is refreshed by cron every few minutes and
// the page's own revalidation picks it up. Nothing here runs in
// the browser, so a backgrounded tab costs nothing.
// ============================================================

export default function LiveBanner({ status }: { status: LiveStatus | null }) {
  if (!status?.is_live) return null;

  const viewers = formatCompactNumber(status.viewer_count);

  return (
    <a
      href={WD.twitch.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-[var(--blade)] bg-blade text-bone"
    >
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-4 gap-y-1 px-gutter py-3">
        <span className="flex items-center gap-2 font-mono text-meta uppercase tracking-button">
          <span className="pulse-live inline-block h-2 w-2 rounded-full bg-bone" aria-hidden />
          Live now
        </span>
        {status.title && (
          <span className="min-w-0 flex-1 truncate text-sm text-bone/90">{status.title}</span>
        )}
        {viewers && (
          <span className="font-mono text-meta uppercase tracking-button tabular-nums">
            {viewers} watching
          </span>
        )}
        <span className="font-mono text-meta uppercase tracking-button underline-offset-4 group-hover:underline">
          Watch on Twitch
        </span>
      </div>
    </a>
  );
}
