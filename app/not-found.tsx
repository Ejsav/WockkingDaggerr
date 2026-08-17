import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[70svh] max-w-2xl place-items-center px-gutter py-section text-center">
      <div>
        <p className="eyebrow-accent mb-5">404</p>
        <h1 className="display text-[clamp(2.5rem,9vw,6rem)]">
          Nothing
          <br />
          <span className="text-blade-text">here.</span>
        </h1>
        <p className="prose-body mx-auto mt-6">
          This page does not exist, or it was pulled. The archive and the store are still where you
          left them.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/watch" className="btn btn-primary">
            <span>The archive</span>
          </Link>
          <Link href="/" className="btn btn-secondary">
            <span>Home</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
