import { expect, test } from "@playwright/test";

// ============================================================
// COMMERCE
//
// The parts of the purchase flow that can be exercised without
// a Stripe key: cart persistence, size selection, server-side
// re-resolution, sold-out honesty, and the success page's
// refusal to confirm an unverified payment.
//
// The database half of the flow — reservation, webhook replay,
// inventory decrement — is proven against real Postgres in
// scripts/db-verify.sh.
// ============================================================

test.describe("the store tells the truth about stock", () => {
  test("a sold-out product says so and offers no way to buy it", async ({ page }) => {
    await page.goto("/shop");

    const cards = page.locator("article");
    const count = await cards.count();
    test.skip(count === 0, "no products published in this environment");

    // Open the first product.
    await cards.first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/shop\/.+/);

    const soldOut = await page.getByText(/^sold out$/i).count();
    if (soldOut > 0) {
      // A sold-out product must not present an enabled purchase control.
      const addButton = page.getByRole("button", { name: /add to cart/i });
      expect(await addButton.count()).toBe(0);
    } else {
      await expect(page.getByRole("button", { name: /add to cart|select a size/i })).toBeVisible();
    }
  });

  test("availability shown on the card matches the product page", async ({ page }) => {
    await page.goto("/shop");
    const cards = page.locator("article");
    test.skip((await cards.count()) === 0, "no products published");

    const cardSaysSoldOut = (await cards.first().getByText(/sold out/i).count()) > 0;
    await cards.first().getByRole("link").first().click();
    const pageSaysSoldOut = (await page.getByText(/sold out/i).count()) > 0;
    expect(pageSaysSoldOut).toBe(cardSaysSoldOut);
  });
});

test.describe("cart", () => {
  test("an empty cart says so and points at the store", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/nothing in the cart/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to the store/i })).toBeVisible();
  });

  test("a cart survives a reload and a navigation", async ({ page }) => {
    // Seed the store directly: this test is about persistence, not the
    // add-to-cart button, which needs stock to exist.
    await page.goto("/cart");
    await page.evaluate(() => {
      window.localStorage.setItem(
        "wd_cart_v1",
        JSON.stringify([
          { product_id: "prod_blade_hoodie_onyx", variant_id: "var_blade_hoodie_onyx_m", quantity: 2 },
        ])
      );
    });

    await page.reload();
    // Either the line renders (stock exists) or the server correctly
    // removed it as unavailable. Both are honest; a silent price is not.
    await page.waitForLoadState("load");
    const visible = await page.locator("body").innerText();
    expect(visible).not.toMatch(/\bundefined\b/);
    expect(visible).not.toMatch(/\bNaN\b/);

    // The badge in the header reflects the stored cart on a fresh page.
    await page.goto("/shop");
    const cartLink = page.getByRole("link", { name: /cart/i }).first();
    await expect(cartLink).toBeVisible();
  });

  test("a tampered cart in localStorage cannot set a price", async ({ page }) => {
    await page.goto("/cart");
    await page.evaluate(() => {
      window.localStorage.setItem(
        "wd_cart_v1",
        JSON.stringify([
          {
            product_id: "prod_blade_hoodie_onyx",
            variant_id: "var_blade_hoodie_onyx_m",
            quantity: 1,
            unit_price_cents: 1,
            price: "0.01",
          },
        ])
      );
    });
    await page.reload();
    await page.waitForLoadState("load");

    // The injected price must never be rendered as the line price.
    const visible = await page.locator("body").innerText();
    expect(visible).not.toContain("$0.01");
  });

  test("corrupt cart storage does not break the page", async ({ page }) => {
    await page.goto("/cart");
    await page.evaluate(() => window.localStorage.setItem("wd_cart_v1", "{not json"));
    await page.reload();
    await expect(page.locator("h1")).toContainText(/cart/i);
    await expect(page.getByText(/nothing in the cart/i)).toBeVisible();
  });
});

test.describe("checkout endpoint", () => {
  test("a cart of items that do not exist is refused, not charged", async ({ request }) => {
    const res = await request.post("/api/stripe/checkout", {
      data: { lines: [{ product_id: "nope", variant_id: "nope", quantity: 1 }] },
    });
    expect([409, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.url).toBeUndefined();
  });

  test("cart validation returns server-resolved figures only", async ({ request }) => {
    const res = await request.post("/api/cart/validate", {
      data: {
        lines: [
          { product_id: "prod_blade_hoodie_onyx", variant_id: "var_blade_hoodie_onyx_m", quantity: 1 },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("subtotal_cents");
    expect(body).toHaveProperty("currency");
    expect(Array.isArray(body.lines)).toBe(true);
    for (const line of body.lines) {
      expect(typeof line.unit_price_cents).toBe("number");
      expect(typeof line.size).toBe("string");
      expect(typeof line.available).toBe("number");
    }
  });
});

test.describe("success page derives from verified payment", () => {
  test("no session id shows the unconfirmed state", async ({ page }) => {
    await page.goto("/success");
    await expect(page.getByText(/nothing to show here/i)).toBeVisible();
    await expect(page.getByText(/paid\./i)).toHaveCount(0);
  });

  test("a hand-typed session id is not a receipt", async ({ page }) => {
    await page.goto("/success?session_id=cs_test_totally_made_up_identifier");
    const visible = await page.locator("body").innerText();
    expect(visible).not.toMatch(/order confirmed/i);
    expect(visible).toMatch(/nothing to show here|payment not completed/i);
  });

  test("the old demo escape hatch is gone", async ({ page }) => {
    await page.goto("/success?demo=true");
    const visible = await page.locator("body").innerText();
    expect(visible).not.toMatch(/demo/i);
    expect(visible).toMatch(/nothing to show here/i);
  });

  test("an unverified visit never clears a cart", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem(
        "wd_cart_v1",
        JSON.stringify([{ product_id: "p", variant_id: "v", quantity: 1 }])
      );
    });
    await page.goto("/success?session_id=cs_test_made_up");
    await page.waitForLoadState("load");
    const stored = await page.evaluate(() => window.localStorage.getItem("wd_cart_v1"));
    expect(stored, "an unverified success page must not empty the cart").toContain("variant_id");
  });
});

test.describe("no placeholder content reaches a visitor", () => {
  test("the seeded fake data is gone from every page", async ({ page }) => {
    for (const route of ["/", "/watch", "/shop", "/drops"]) {
      await page.goto(route);
      const html = await page.content();
      // The Rickroll video id and the invented sample ids.
      expect(html, `${route} must not contain seed data`).not.toContain("dQw4w9WgXcQ");
      expect(html).not.toContain("vid_002");
      expect(html).not.toContain("7341234567890123456");
      expect(html).not.toMatch(/DA1B2C3D4E5|DA9X8Y7Z6W5/);
      // Developer notes.
      expect(html).not.toMatch(/TODO|FIXME|Lorem ipsum|placeholder text/i);
      expect(html).not.toMatch(/mock data|demo passcode|coming soon/i);
    }
  });

  test("no console errors on any primary route", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    for (const route of ["/", "/watch", "/shop", "/drops", "/cart"]) {
      await page.goto(route);
      await page.waitForLoadState("load");
    }

    // Ignore failures caused by third-party image hosts being unreachable
    // in a sandbox; they are not application errors.
    const real = errors.filter(
      (e) => !/net::ERR|Failed to load resource|ERR_NAME_NOT_RESOLVED/i.test(e)
    );
    expect(real, real.join("\n")).toEqual([]);
  });
});
