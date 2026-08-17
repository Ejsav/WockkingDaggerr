import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { adminAuthConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = adminAuthConfigured();

  return (
    <section className="mx-auto grid min-h-[80svh] max-w-md place-items-center px-gutter py-section">
      <div className="w-full">
        <p className="eyebrow-accent mb-5">Control room</p>
        <h1 className="display text-[clamp(2.25rem,7vw,3.5rem)]">
          Restricted
          <br />
          <span className="text-blade-text">access.</span>
        </h1>

        {configured ? (
          <Suspense fallback={<p className="meta mt-10">Loading…</p>}>
            <LoginForm />
          </Suspense>
        ) : (
          <p className="prose-body mt-8">
            Sign-in is not configured on this deployment. Set{" "}
            <code className="font-mono text-xs text-primary">ADMIN_PASSWORD</code> and{" "}
            <code className="font-mono text-xs text-primary">ADMIN_SESSION_SECRET</code> in the
            environment, then redeploy.
          </p>
        )}
      </div>
    </section>
  );
}
