import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_HOST } from "@/lib/env";
import { WD } from "@/lib/wockkingdagger";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms that apply to using the WockkingDagger hub and to buying from the store.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <>
      <p className="eyebrow-accent mb-5">Terms</p>
      <h1>Terms of use &amp; sale</h1>
      <p className="!mt-6 !text-[var(--text-tertiary)] font-mono text-[11px] uppercase tracking-button">
        Applies to {SITE_HOST}
      </p>

      <h2>Who you are dealing with</h2>
      <p>
        This site is operated by {WD.legalName}. Contact for any matter arising from these terms:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Using the site</h2>
      <p>
        You may browse, link to, and share anything published here. You may not scrape it at a rate
        that degrades it for other people, resell access to it, or attempt to reach the private
        admin area or any endpoint you have not been given credentials for.
      </p>

      <h2>Content and intellectual property</h2>
      <p>
        The brand, artwork, product designs, photography and written copy on this site belong to{" "}
        {WD.legalName}. Video thumbnails, titles and embedded players are served from the platforms
        that host them and remain subject to those platforms&rsquo; own terms. Nothing here grants
        you a licence to reproduce the brand or the designs commercially.
      </p>

      <h2>Orders</h2>
      <p>
        Placing an order is an offer to buy. The contract forms when payment is confirmed and you
        receive the confirmation email — not when the item is added to your cart, and not when the
        checkout page loads.
      </p>
      <p>
        Stock counts shown on the site are live, and an item is held for you for the duration of
        the checkout session. If a session expires without payment, the hold is released and the
        item returns to general availability.
      </p>

      <h2>Pricing errors</h2>
      <p>
        Prices are resolved on the server at the moment of checkout, so the amount you are charged
        is always the amount on record for that item. If a genuine pricing error is nonetheless
        published, we may cancel the affected order and refund it in full rather than fulfil it at
        the wrong price. You will be told before anything is cancelled.
      </p>

      <h2>Drops and limited runs</h2>
      <p>
        Drops open and close at the times stated. A limited run is limited: once its stock is
        exhausted it is not restocked, and being early in a queue confers no entitlement to a
        purchase that has already sold through.
      </p>

      <h2>Delivery and returns</h2>
      <p>
        Dispatch times, destinations, duties and the returns process are set out in full on the{" "}
        <Link href="/legal/shipping-returns">shipping and returns page</Link>, which forms part of
        these terms.
      </p>

      <h2>Availability of the site</h2>
      <p>
        The site is provided as it stands. It depends on third-party services — payment processing,
        hosting, and the platforms the video archive is synced from — and may be unavailable or
        incomplete while any of those are. No guarantee of uninterrupted availability is given.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Liability for any order is limited to the amount paid for that order. Nothing in these
        terms limits liability for death or personal injury caused by negligence, for fraud, or for
        anything else that cannot lawfully be limited. Your statutory rights as a consumer are
        unaffected.
      </p>

      <h2>Mailing list</h2>
      <p>
        Signing up means you agree to receive email about releases and drops. Adding a phone number
        and ticking the consent box means you agree to receive SMS about the same. Both can be
        stopped at any time, and stopping one does not stop the other.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        These terms may change. The version in force for your order is the version published when
        you placed it.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of the jurisdiction in which {WD.legalName} operates,
        and any dispute is subject to the non-exclusive jurisdiction of its courts. If you are a
        consumer, this does not deprive you of the protection of the mandatory law of your country
        of residence.
      </p>
    </>
  );
}
