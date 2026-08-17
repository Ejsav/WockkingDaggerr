import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_HOST } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What data the WockkingDagger hub collects, why, who processes it, and how to have it deleted.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <p className="eyebrow-accent mb-5">Privacy</p>
      <h1>Privacy policy</h1>
      <p className="!mt-6 !text-[var(--text-tertiary)] font-mono text-[11px] uppercase tracking-button">
        Applies to {SITE_HOST}
      </p>

      <h2>The short version</h2>
      <p>
        This site collects the minimum it needs to sell you something and to email you if you ask
        it to. It does not sell personal data, does not run advertising trackers, and does not
        build a profile of you across other websites.
      </p>

      <h2>What is collected, and why</h2>
      <ul>
        <li>
          <strong>Order details.</strong> When you buy something: your email address, delivery
          address, name, what you ordered, and the amount paid. This is needed to take payment and
          ship the parcel.
        </li>
        <li>
          <strong>Payment details.</strong> Card numbers are entered on Stripe&rsquo;s own checkout
          page and never touch this site&rsquo;s servers. We receive confirmation that a payment
          succeeded, the amount, and the last four digits — nothing more.
        </li>
        <li>
          <strong>Mailing list.</strong> If you sign up: your email address, optionally a phone
          number, whether you consented to SMS, and which page you signed up from.
        </li>
        <li>
          <strong>Usage events.</strong> Aggregate, non-identifying counts of page views and
          checkout steps, used to find where the purchase flow breaks. No cookies are set for this,
          and no cross-site identifier is used.
        </li>
        <li>
          <strong>Error reports.</strong> When something fails server-side, the error and a random
          reference code are logged. Values that look like keys, tokens, passwords or cookies are
          redacted before the log is written.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        This site sets one cookie, and only for the operator: an <code>httpOnly</code> session
        cookie created when signing in to the private admin area. There is no advertising cookie,
        no analytics cookie, and no consent banner because there is nothing to consent to. Your
        cart is stored in your browser&rsquo;s local storage, which stays on your device and is
        never transmitted except as the item identifiers needed to price the order.
      </p>

      <h2>Who processes your data</h2>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing, fraud checks, receipts. Stripe is the
          controller of your card data.
        </li>
        <li>
          <strong>Supabase</strong> — the database holding orders and mailing-list entries.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and server logs.
        </li>
      </ul>
      <p>
        Each of these is a processor acting on instruction, bound by its own data-processing terms.
        No one else receives your data, and it is never sold.
      </p>

      <h2>How long it is kept</h2>
      <p>
        Order records are kept for seven years, because tax and accounting rules require it.
        Mailing-list entries are kept until you unsubscribe. Server logs are kept for 30 days.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a copy of the data held about you, ask for it to be corrected, or ask for
        it to be deleted. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and you
        will get a response within 30 days. Deletion requests are honoured except where an order
        record must be retained for the tax period above.
      </p>
      <p>
        If you are in the UK or EU, you also have the right to complain to your national data
        protection authority.
      </p>

      <h2>Unsubscribing</h2>
      <p>
        Every email has an unsubscribe link. For SMS, reply STOP. Either removes you immediately
        and permanently; you do not need to email anyone.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes in a way that affects how your data is used, the change is announced
        by email to anyone on the mailing list before it takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        Data protection enquiries: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
