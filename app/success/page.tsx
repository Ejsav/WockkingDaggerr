import Link from "next/link";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { demo?: string; session_id?: string };
}) {
  const isDemo = searchParams.demo === "true";

  return (
    <section className="flex min-h-[100svh] items-center justify-center px-5 pt-32 md:px-10">
      <div className="max-w-2xl text-center">
        <p className="eyebrow-blade mb-6">━━ ORDER CONFIRMED</p>
        <h1 className="display text-[clamp(3rem,10vw,7rem)] leading-[0.9] text-bone">
          {isDemo ? "DEMO" : "ORDER"} <br />
          <span className="text-blade">RECEIVED.</span>
        </h1>
        <p className="mt-8 text-bone/60 md:text-lg">
          {isDemo
            ? "This was a demo checkout — no payment was taken. Add STRIPE_SECRET_KEY to .env.local to enable live transactions."
            : "Your order is in. You'll get a confirmation email within minutes and a tracking number once it ships within 48 hours."}
        </p>

        {searchParams.session_id && !isDemo && (
          <p className="mt-6 break-all font-mono text-[10px] uppercase tracking-widest text-bone/40">
            REF: {searchParams.session_id}
          </p>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn-blade">
            KEEP SHOPPING →
          </Link>
          <Link href="/" className="btn-bone">
            BACK TO HUB
          </Link>
        </div>
      </div>
    </section>
  );
}
