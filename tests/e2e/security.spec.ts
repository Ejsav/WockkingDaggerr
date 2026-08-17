import { expect, test } from "@playwright/test";

// ============================================================
// AUTHORIZATION BOUNDARIES
//
// These are executed requests, not code review. Each one is a
// door somebody will try.
// ============================================================

test.describe("admin is gated", () => {
  test("an unauthenticated visit to /admin never renders admin content", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(400);

    // Redirected to the sign-in page…
    await expect(page).toHaveURL(/\/admin\/login/);

    // …and none of the control-room data reached the browser. The sign-in
    // page is allowed to be titled "Control room"; the dashboard is not
    // allowed to have rendered any of its figures or controls.
    const html = await page.content();
    for (const leak of ["Units in stock", "Paid orders", "Revenue", "Subscribers", "Sign out"]) {
      expect(html, `${leak} must not reach an unauthenticated browser`).not.toContain(leak);
    }
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /run sync/i })).toHaveCount(0);
  });

  test("a deep admin URL redirects rather than rendering", async ({ page }) => {
    await page.goto("/admin/anything/deep");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a forged session cookie does not open the door", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "wd_admin_session",
        value: `${Date.now() + 999999999}.forged.signature`,
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("admin APIs reject anonymous callers", () => {
  const endpoints = [
    "/api/admin/inventory",
    "/api/admin/product",
    "/api/admin/media",
    "/api/admin/drop",
  ];

  for (const endpoint of endpoints) {
    test(`POST ${endpoint} answers 401`, async ({ request }) => {
      const res = await request.post(endpoint, { data: { anything: true } });
      expect(res.status()).toBe(401);
      // No hint about what the endpoint does or why it failed.
      const body = await res.text();
      expect(body).not.toMatch(/supabase|postgres|relation|column|stack/i);
    });
  }
});

test.describe("sync endpoints are not publicly callable", () => {
  const sources = ["youtube", "twitch", "tiktok", "instagram", "all", "live"];

  for (const source of sources) {
    test(`POST /api/sync/${source} answers 401`, async ({ request }) => {
      const res = await request.post(`/api/sync/${source}`);
      expect(res.status()).toBe(401);
    });

    test(`GET /api/sync/${source} answers 401 — a browser cannot trigger it`, async ({ request }) => {
      const res = await request.get(`/api/sync/${source}`);
      expect(res.status()).toBe(401);
    });
  }

  test("a wrong bearer token is refused", async ({ request }) => {
    const res = await request.post("/api/sync/youtube", {
      headers: { authorization: "Bearer not-the-cron-secret" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("the Stripe webhook refuses unsigned bodies", () => {
  test("no signature header is a 400 or 503, never a 200", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      data: { type: "checkout.session.completed", id: "evt_forged" },
    });
    expect([400, 503]).toContain(res.status());
  });

  test("a bogus signature is rejected", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
      data: { type: "checkout.session.completed", id: "evt_forged" },
    });
    expect([400, 503]).toContain(res.status());
  });
});

test.describe("input validation", () => {
  test("checkout rejects a malformed cart", async ({ request }) => {
    for (const payload of [
      {},
      { lines: [] },
      { lines: [{ product_id: "p", variant_id: "v", quantity: -1 }] },
      { lines: [{ product_id: "p", variant_id: "v", quantity: 99999 }] },
    ]) {
      const res = await request.post("/api/stripe/checkout", { data: payload });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test("checkout ignores a client-supplied price", async ({ request }) => {
    const res = await request.post("/api/stripe/checkout", {
      data: {
        lines: [{ product_id: "prod_blade_hoodie_onyx", variant_id: "var_blade_hoodie_onyx_m", quantity: 1, unit_price_cents: 1 }],
      },
    });
    // Whatever the outcome — sold out, unconfigured, or a real session —
    // it is never a success built on the price the client sent.
    const body = await res.text();
    expect(body).not.toContain("unit_price_cents\":1,");
    expect(res.status()).not.toBe(500);
  });

  test("subscribe rejects an invalid email and a phone without consent", async ({ request }) => {
    expect((await request.post("/api/subscribe", { data: { email: "nope" } })).status()).toBe(400);
    expect((await request.post("/api/subscribe", { data: {} })).status()).toBe(400);
    expect(
      (await request.post("/api/subscribe", { data: { phone: "+15550000000" } })).status()
    ).toBe(400);
  });

  test("error bodies never leak internals", async ({ request }) => {
    const res = await request.post("/api/subscribe", { data: { email: "nope" } });
    const body = await res.text();
    expect(body).not.toMatch(/supabase|postgres|relation "|at Object\.|node_modules/i);
  });
});

test.describe("secrets stay on the server", () => {
  test("no server-only value appears in any script the browser downloads", async ({ page }) => {
    const scripts: string[] = [];
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/_next/static/") && url.endsWith(".js")) {
        try {
          scripts.push(await response.text());
        } catch {
          /* streamed away */
        }
      }
    });

    await page.goto("/", { waitUntil: "load" });
    await page.goto("/shop", { waitUntil: "load" });

    const bundle = scripts.join("\n");
    for (const forbidden of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
      "CRON_SECRET",
      "YOUTUBE_API_KEY",
      "TWITCH_CLIENT_SECRET",
      "NEXT_PUBLIC_ADMIN_PASSCODE",
    ]) {
      expect(bundle, `${forbidden} must not appear in a client bundle`).not.toContain(forbidden);
    }

    // The old client-side passcode gate is gone: no sessionStorage flag,
    // and no hardcoded default. Checking the storage key rather than the
    // word "dagger", which legitimately appears in the brand name.
    expect(bundle, "the sessionStorage auth flag must be gone").not.toContain("wd_admin_gate");
    expect(bundle).not.toMatch(/passcode\s*===|===\s*['"]dagger['"]/);
  });
});

test.describe("security headers", () => {
  test("every response carries the hardening headers", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
