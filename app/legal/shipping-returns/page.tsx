import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/env";
import { SHIPPING_COUNTRIES_DISPLAY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description:
    "Dispatch times, delivery destinations, duties, and the 30-day returns policy for the WockkingDagger store.",
  alternates: { canonical: "/legal/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <>
      <p className="eyebrow-accent mb-5">Store policy</p>
      <h1>Shipping &amp; returns</h1>

      <h2>Dispatch</h2>
      <p>
        Orders are packed and dispatched within two business days of payment clearing. You receive
        a tracking number by email the moment the parcel leaves. Drops and pre-orders are the one
        exception: their dispatch window is stated on the drop itself, and that date takes
        precedence over the two-day standard.
      </p>

      <h2>Where we ship</h2>
      <p>
        Checkout accepts delivery addresses in: {SHIPPING_COUNTRIES_DISPLAY}. If your country is
        not on that list, the order cannot be completed at checkout — email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and ask before you try.
      </p>

      <h2>Delivery cost and time</h2>
      <p>
        Shipping is calculated at checkout from the destination address, and the exact figure is
        shown before you pay. Nothing is added afterwards. Transit time depends on the carrier and
        the destination; the tracking link is the authoritative estimate once the parcel is moving.
      </p>

      <h2>Duties and import taxes</h2>
      <p>
        Orders shipped outside the country of dispatch may attract import duty, VAT, or a customs
        handling fee. Those charges are set by the destination country, are collected by the
        carrier or customs authority, and are the recipient&rsquo;s responsibility. They are not
        included in the price shown at checkout. A refused parcel that is returned because duties
        were not paid is refunded less the outbound and return shipping actually incurred.
      </p>

      <h2>Returns</h2>
      <p>
        You may return an unworn item within 30 days of delivery for a refund. Items must come back
        unworn and unwashed, with the original tags attached, in a condition we could sell again.
        Start a return by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your
        order reference; you will get a return address by reply. Do not send anything back before
        you have that reply.
      </p>
      <p>
        Return postage is paid by you unless the item arrived faulty or we sent the wrong thing.
        Refunds are issued to the original payment method within five business days of the return
        arriving, for the price of the goods plus any outbound shipping if the whole order is
        returned.
      </p>

      <h2>Faulty or incorrect items</h2>
      <p>
        If an item arrives damaged, faulty, or is not what you ordered, email within 14 days of
        delivery with your order reference and a photograph. We cover return postage and either
        replace the item or refund it in full, your choice. This sits alongside your statutory
        rights and does not replace them.
      </p>

      <h2>Cancelling an order</h2>
      <p>
        An order can be cancelled for a full refund at any point before it is dispatched. Email as
        soon as you can — once the tracking number is issued, the return process above applies
        instead.
      </p>

      <h2>Lost parcels</h2>
      <p>
        If tracking shows no movement for ten business days, contact us and we will open a claim
        with the carrier. Once a claim resolves, a lost parcel is replaced or refunded in full.
      </p>

      <h2>Contact</h2>
      <p>
        Everything above is handled from one address:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Include your order reference and
        you will get a reply within two business days.
      </p>
    </>
  );
}
