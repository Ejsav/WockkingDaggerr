"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here when you add one
    console.error("[WD Error]", error);
  }, [error]);

  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center px-5 pt-32 text-center md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.08),transparent_60%)]" />

      <div className="relative z-10 max-w-3xl">
        <p className="eyebrow-blade mb-6">━━ ERROR</p>

        <h1 className="display text-[clamp(5rem,15vw,14rem)] leading-[0.85] text-bone">
          BROKE.
        </h1>

        <p className="mt-8 text-base text-bone/60 md:text-lg">
          Something went wrong on the server side. It&apos;s logged.
          Try again — if it keeps happening, the team knows.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-bone/30">
            REF: {error.digest}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button onClick={reset} className="btn-blade">
            TRY AGAIN →
          </button>
          <Link href="/" className="btn-bone">
            BACK TO HUB
          </Link>
        </div>
      </div>
    </section>
  );
}
