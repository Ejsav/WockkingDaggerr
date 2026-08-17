import { Suspense } from "react";
import type { Metadata } from "next";
import CartView from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your order before checkout.",
  alternates: { canonical: "/cart" },
  // A personal, per-visitor page. Nothing to index.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-shell px-gutter pb-section pt-10 md:pt-16">
      <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">Cart</h1>
      {/* CartView reads ?cancelled= from the URL, which forces a client
          bailout; the boundary keeps the heading in the prerendered HTML.

          The min-height is load-bearing: without it the one-line fallback
          is replaced by a full cart and the footer jumps, which measured
          as 0.13 CLS. */}
      <div className="min-h-[32rem]">
        <Suspense fallback={<p className="meta mt-10">Loading your cart…</p>}>
          <CartView />
        </Suspense>
      </div>
    </section>
  );
}
