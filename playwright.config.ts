import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// ============================================================
// E2E runs against a real production build, not the dev server:
// the dev server hides prerendering, caching and bundling bugs.
//
// Environment: the suite is written to pass with or without
// Supabase and Stripe configured. Where a check needs live data
// it asserts on the honest empty state instead of skipping, so
// an unconfigured deployment is still verified end to end.
// ============================================================

const PORT = 3100;

// This sandbox ships a pinned Chromium build under PLAYWRIGHT_BROWSERS_PATH
// that may not match the revision this Playwright version would download.
// Point at it explicitly rather than fetching another copy.
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const launchOptions = existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions } },
    {
      // 320px is the narrowest width still in real use. Layout is checked
      // here, not inferred from a breakpoint.
      name: "mobile-320",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
        viewport: { width: 320, height: 720 },
        isMobile: false,
      },
    },
    {
      name: "mobile-390",
      use: { ...devices["iPhone 14"], defaultBrowserType: "chromium", launchOptions },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],

  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
