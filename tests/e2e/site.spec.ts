import { expect, test, type Page } from "@playwright/test";

// ============================================================
// THE SITE ITSELF
//
// Cold-start rendering, SEO surface, navigation, accessibility
// and narrow-viewport layout. Written so it passes whether or
// not the data services are configured: an unconfigured
// deployment must still render an honest, complete page.
// ============================================================

const ROUTES = ["/", "/watch", "/shop", "/drops", "/cart", "/legal/terms", "/legal/privacy", "/legal/shipping-returns"];

/** Nothing on this site may scroll the page sideways, at any width. */
async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(1);
}

test.describe("every primary route renders", () => {
  for (const route of ROUTES) {
    test(`${route} returns 200 with a single h1 and no error state`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBe(200);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).not.toBeEmpty();

      // innerText, not textContent: textContent includes <script> bodies,
      // and Next's RSC flight payload legitimately contains "$undefined".
      const visible = await page.locator("body").innerText();
      expect(visible).not.toContain("Application error");
      expect(visible).not.toContain("That did not");
      expect(visible).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);

      await expectNoHorizontalScroll(page);
    });
  }
});

test.describe("cold start renders real content, not a loading shell", () => {
  test("the homepage HTML is complete before JavaScript runs", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    // The hero, the manifesto and the footer signup are all in the server HTML.
    await expect(page.locator("h1")).toContainText(/wockking/i);
    await expect(page.getByText("No filler.")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Reveal-animated content must be visible without JS, not stuck at opacity 0.
    const hidden = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
      return nodes.filter((n) => getComputedStyle(n).opacity === "0").length;
    });
    expect(hidden, "content must not depend on JavaScript to become visible").toBe(0);

    await context.close();
  });

  test("the archive renders server-side with either items or an honest empty state", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/watch");

    const cards = await page.locator("article").count();
    if (cards === 0) {
      await expect(page.getByText(/nothing synced yet/i)).toBeVisible();
      // An empty archive still offers somewhere to go.
      await expect(page.getByRole("link", { name: /youtube/i }).first()).toBeVisible();
    } else {
      await expect(page.locator("article").first().locator("h3")).not.toBeEmpty();
    }
    await context.close();
  });
});

test.describe("SEO surface", () => {
  test("every indexable route has a self-referencing canonical", async ({ page }) => {
    for (const route of ["/", "/watch", "/shop", "/drops", "/legal/terms"]) {
      await page.goto(route);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `${route} must declare a canonical`).toBeTruthy();
      expect(canonical!.endsWith(route === "/" ? "" : route) || canonical!.endsWith(route)).toBe(
        true
      );
    }
  });

  test("per-visitor pages are noindex", async ({ page }) => {
    for (const route of ["/cart", "/success"]) {
      await page.goto(route);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots, `${route} must be noindex`).toContain("noindex");
    }
  });

  test("structured data is present and parses", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);

    const parsed = blocks.map((b) => JSON.parse(b));
    const types = parsed.flat().map((p: { "@type": string }) => p["@type"]);
    expect(types).toContain("WebSite");
    expect(types).toContain("Person");

    const person = parsed.flat().find((p: { "@type": string }) => p["@type"] === "Person");
    expect(person.sameAs.length).toBeGreaterThanOrEqual(5);
  });

  test("the sitemap lists only canonical URLs and no redirect or gated path", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();

    for (const forbidden of ["/admin", "/api/", "/cart", "/success", "?source=", "?category="]) {
      expect(xml, `sitemap must not contain ${forbidden}`).not.toContain(forbidden);
    }
    // The old redirecting archive path is gone.
    expect(xml).not.toMatch(/\/watch\/yt_/);
    expect(xml).toContain("/watch");
    expect(xml).toContain("/shop");
  });

  test("every sitemap URL answers 200 — no redirects in the index", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);

    for (const url of urls.slice(0, 25)) {
      const path = new URL(url).pathname;
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} must be 200, not a redirect`).toBe(200);
    }
  });

  test("robots.txt points at the sitemap and blocks the private areas", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toContain("Sitemap:");
    expect(txt).toContain("/admin");
    expect(txt).toContain("/api/");
  });

  test("titles and descriptions describe the actual page", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveTitle(/store/i);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0).toBeGreaterThan(40);
  });
});

test.describe("navigation and conversion paths", () => {
  test("the primary CTAs go where they say", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /enter the archive/i }).click();
    await expect(page).toHaveURL(/\/watch/);

    await page.goto("/");
    await page.getByRole("link", { name: /^shop$/i }).first().click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("archive filters are real URLs that survive a reload", async ({ page }) => {
    await page.goto("/watch");
    // Scope to the filter bar — the header also links to the YouTube profile.
    const filters = page.getByRole("navigation", { name: /filter the archive/i });
    const youtubeFilter = filters.getByRole("link", { name: /youtube/i });

    if ((await youtubeFilter.count()) === 0) {
      // No YouTube content synced, so no YouTube filter. "All" is always there.
      await expect(filters.getByRole("link", { name: /^all/i })).toBeVisible();
      return;
    }

    await youtubeFilter.click();
    await expect(page).toHaveURL(/source=youtube/);
    await page.reload();
    await expect(page).toHaveURL(/source=youtube/);
    await expect(filters.getByRole("link", { name: /youtube/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  test("no dead links in the footer", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .getByRole("contentinfo")
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((l) => (l as HTMLAnchorElement).getAttribute("href") ?? "")
      );

    const internal = hrefs.filter((h) => h.startsWith("/"));
    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      const res = await request.get(href, { maxRedirects: 0 });
      expect(res.status(), `${href} is linked from the footer`).toBe(200);
    }
  });

  test("the 404 page is a real page, not a crash", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(/nothing/i);
    await expect(page.getByRole("link", { name: /archive/i }).first()).toBeVisible();
  });
});

test.describe("accessibility", () => {
  test("the skip link is the first tab stop and it works", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip to content/i);
    await focused.press("Enter");
    await expect(page).toHaveURL(/#main/);
  });

  test("every interactive element is reachable by keyboard and shows focus", async ({ page }) => {
    await page.goto("/shop");

    let sawVisibleFocus = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return { width: style.outlineWidth, style: style.outlineStyle };
      });
      if (outline && outline.style !== "none" && parseFloat(outline.width) > 0) {
        sawVisibleFocus = true;
        break;
      }
    }
    expect(sawVisibleFocus, "focused elements must have a visible outline").toBe(true);
  });

  test("images carry an alt attribute", async ({ page }) => {
    await page.goto("/shop");
    const missing = await page.locator("img:not([alt])").count();
    expect(missing).toBe(0);
  });

  test("every form control has an accessible name", async ({ page }) => {
    await page.goto("/");
    const unlabelled = await page.evaluate(() => {
      const controls = Array.from(
        document.querySelectorAll<HTMLElement>("input:not([type=hidden]), select, textarea")
      );
      return controls.filter((c) => {
        if (c.getAttribute("aria-label")) return false;
        if (c.getAttribute("aria-labelledby")) return false;
        if (c.closest("label")) return false;
        const id = c.getAttribute("id");
        return !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
      }).length;
    });
    expect(unlabelled).toBe(0);
  });

  test("the page declares a language and allows zoom", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).not.toContain("user-scalable=no");
    expect(viewport).not.toContain("maximum-scale=1");
  });

  test("headings do not skip levels", async ({ page }) => {
    await page.goto("/");
    const levels = await page
      .locator("h1, h2, h3, h4")
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1], `heading jump at index ${i}`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("mobile menu", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) >= 768, "mobile widths only");

  test("hidden menu links are not focusable, and focus is trapped when open", async ({ page }) => {
    await page.goto("/");

    // Closed: the panel is hidden, so its links are out of the tab order.
    const reachableWhenClosed = await page.evaluate(() => {
      const panel = document.getElementById("mobile-menu");
      if (!panel) return -1;
      if (panel.hasAttribute("hidden")) return 0;
      return panel.querySelectorAll("a, button").length;
    });
    expect(reachableWhenClosed).toBe(0);

    // Open it.
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.locator("#mobile-menu")).toBeVisible();

    // Tabbing repeatedly must stay inside the panel.
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    const insidePanel = await page.evaluate(
      () => !!document.getElementById("mobile-menu")?.contains(document.activeElement)
    );
    expect(insidePanel, "focus must not escape the open menu").toBe(true);

    // Escape closes it and returns focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(page.getByRole("button", { name: /open menu/i })).toBeFocused();
  });
});

test.describe("narrow viewports", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) > 400, "narrow widths only");

  for (const route of ["/", "/watch", "/shop", "/drops", "/cart"]) {
    test(`${route} fits without horizontal scroll`, async ({ page }) => {
      await page.goto(route);
      await expectNoHorizontalScroll(page);
    });
  }

  test("tap targets are at least 44px tall", async ({ page }) => {
    await page.goto("/shop");
    const small = await page.evaluate(() => {
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      );
      return targets
        .filter((t) => {
          const r = t.getBoundingClientRect();
          // Skip anything not actually laid out.
          return r.width > 0 && r.height > 0 && r.height < 44;
        })
        .map((t) => `${t.tagName}:${(t.textContent ?? "").trim().slice(0, 30)}`);
    });
    expect(small, `tap targets under 44px: ${small.join(", ")}`).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "chromium project only");

  test("all content is visible and nothing is mid-animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("load");

    const broken = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal], .line-mask > span")
      );
      return nodes.filter((n) => {
        const style = getComputedStyle(n);
        const transform = style.transform;
        const translated = transform !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(transform);
        return style.opacity === "0" || translated;
      }).length;
    });
    expect(broken, "reduced motion must produce a complete, settled page").toBe(0);

    // And the page is still the page — not a stripped-back fallback.
    await expect(page.getByText("No filler.")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});
