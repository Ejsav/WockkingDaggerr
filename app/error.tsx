"use client";

import { useEffect } from "react";
import Link from "next/link";

// Client-side error boundary. `digest` is the server-generated id that
// correlates to the logged error — it is safe to show and useful in
// support, unlike the message itself.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boundary]", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="mx-auto grid min-h-[70svh] max-w-2xl place-items-center px-gutter py-section text-center">
      <div>
        <p className="eyebrow-accent mb-5">Something broke</p>
        <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">
          That did not
          <br />
          <span className="text-blade-text">work.</span>
        </h1>
        <p className="prose-body mx-auto mt-6">
          The page failed to load. Trying again usually fixes it; if it does not, the reference
          below will tell us what happened.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <span>Try again</span>
          </button>
          <Link href="/" className="btn btn-secondary">
            <span>Home</span>
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 font-mono text-[11px] uppercase tracking-button text-tertiary">
            Reference {error.digest}
          </p>
        )}
      </div>
    </section>
  );
}
