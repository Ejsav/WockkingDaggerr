// ============================================================
// CORE WEB VITALS
//
// Measures LCP, CLS and TBT against a running production build.
// The observers are installed via addInitScript so they are
// registered before the document starts parsing — querying the
// timeline after load misses entries that were never buffered.
//
//   node scripts/measure-vitals.mjs [baseURL]
// ============================================================

import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const ROUTES = ["/", "/watch", "/shop", "/drops", "/cart"];
const RUNS = 3;

// The thresholds Google treats as "good".
const GOOD = { lcp: 2500, cls: 0.1, tbt: 200 };

const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const COLLECTOR = `
  window.__vitals = { lcp: 0, cls: 0, tbt: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__vitals.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__vitals.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__vitals.tbt += Math.max(0, e.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
`;

async function measure(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });

  // Scroll the page so lazy content and scroll-driven motion get a chance
  // to shift the layout. A CLS score taken without scrolling is flattering.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const v = window.__vitals;
    return {
      lcp: Math.round(v.lcp),
      cls: Number(v.cls.toFixed(4)),
      tbt: Math.round(v.tbt),
      ttfb: Math.round(nav?.responseStart ?? 0),
      transferKb: Math.round(
        performance
          .getEntriesByType("resource")
          .reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024
      ),
    };
  });
}

const browser = await chromium.launch({ executablePath: CHROMIUM });
const results = {};

for (const route of ROUTES) {
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(COLLECTOR);
    const page = await context.newPage();
    samples.push(await measure(page, route));
    await context.close();
  }
  const median = (key) => samples.map((s) => s[key]).sort((a, b) => a - b)[1];
  results[route] = {
    lcp: median("lcp"),
    cls: median("cls"),
    tbt: median("tbt"),
    ttfb: median("ttfb"),
    transferKb: median("transferKb"),
  };
}

await browser.close();

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `\n${pad("route", 10)}${pad("LCP", 10)}${pad("CLS", 10)}${pad("TBT", 10)}${pad("TTFB", 10)}${pad("transfer", 11)}verdict`
);
console.log("-".repeat(68));

let allGood = true;
for (const [route, m] of Object.entries(results)) {
  const ok = m.lcp <= GOOD.lcp && m.cls <= GOOD.cls && m.tbt <= GOOD.tbt;
  allGood &&= ok;
  console.log(
    pad(route, 10) +
      pad(`${m.lcp}ms`, 10) +
      pad(m.cls, 10) +
      pad(`${m.tbt}ms`, 10) +
      pad(`${m.ttfb}ms`, 10) +
      pad(`${m.transferKb}KB`, 11) +
      (ok ? "good" : "NEEDS WORK")
  );
}

console.log(`\nGood: LCP <= ${GOOD.lcp}ms · CLS <= ${GOOD.cls} · TBT <= ${GOOD.tbt}ms`);
console.log("Measured on a local production build; treat as a floor, not field data.");
process.exit(allGood ? 0 : 1);
