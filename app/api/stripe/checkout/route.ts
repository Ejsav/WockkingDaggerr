import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_CONFIGURED } from "@/lib/stripe";
import { getProductById } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  line_items: { product_id: string; quantity: number }[];
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.line_items) || body.line_items.length === 0) {
    return NextResponse.json({ error: "line_items is required" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Resolve products from the (mocked or live) catalog
  const resolved = body.line_items.map((li) => {
    const product = getProductById(li.product_id);
    return { product, quantity: Math.max(1, Math.min(li.quantity, 99)) };
  });

  if (resolved.some((r) => !r.product)) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 404 });
  }

  // DEMO FALLBACK — no Stripe key configured.
  // Keeps the checkout flow demoable end to end.
  if (!STRIPE_CONFIGURED) {
    return NextResponse.json({
      url: `${siteUrl}/success?demo=true`,
      demo: true,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: resolved.map(({ product, quantity }) => {
        // Prefer a real Stripe price ID when one exists on the product
        if (product!.stripe_price_id) {
          return { price: product!.stripe_price_id, quantity };
        }
        // Fall back to dynamic price_data
        return {
          price_data: {
            currency: product!.currency.toLowerCase(),
            product_data: {
              name: product!.name,
              description: product!.tagline ?? undefined,
              images: product!.image_urls?.[0] ? [product!.image_urls[0]] : undefined,
            },
            unit_amount: product!.price_cents,
          },
          quantity,
        };
      }),
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop`,
      allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "SE", "JP"],
      },
      automatic_tax: { enabled: false },
      metadata: {
        source: "wockkingdagger-hub",
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a session URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Stripe error" },
      { status: 500 }
    );
  }
}
