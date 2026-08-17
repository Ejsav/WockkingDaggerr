# WockkingDagger Hub

The official hub: live status, the full video archive, drops, and the
store. Next.js 16 (App Router) · React 19 · Supabase · Stripe · Vercel.

---

## Quick start

```bash
npm ci
cp .env.example .env.local     # every variable says what breaks without it
npm run dev
```

The site runs with no credentials at all. Every data-backed surface shows
an honest empty state rather than placeholder content, so what you see
locally is what an unconfigured deploy looks like.

To bring it to life: run `supabase/migrations/*.sql` in order, fill in the
Supabase keys, and set your stock in `/admin` → Inventory.

Full operational detail — deploying, sync, adding a product, running a
drop, rotating secrets, reading the monitoring — is in
**[docs/RUNBOOK.md](docs/RUNBOOK.md)**.

---

## How it fits together

```
Vercel Cron ──bearer──▶ /api/sync/{source} ──▶ YouTube · Twitch · TikTok · Instagram
                               │
                               ▼
                     Postgres (Supabase)  ◀── /api/admin/* (signed session)
                               │
                       invalidate(tag)
                               │
                               ▼
                 tagged cache ─▶ server components ─▶ ISR

Stripe ──signed webhook──▶ commit_purchase() ──▶ order + inventory decrement
```

Two rules the whole design follows:

- **No provider call happens while someone is waiting for a page.** Content
  is synced on a schedule into Postgres; pages read Postgres. A YouTube
  outage makes the archive stale, not unavailable.
- **Nothing depends on a serverless instance staying warm.** There is no
  in-memory cache the site's correctness relies on.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright against a real production build |
| `npm run verify` | typecheck + lint + unit + build — the gate before pushing |
| `scripts/db-verify.sh` | migrations and commerce guarantees against real Postgres |

---

## Layout

```
app/
  api/
    admin/     inventory · product · media · drop · login · logout
    stripe/    checkout · webhook
    sync/      [source] · live      (cron-authenticated)
    cart/      validate
    subscribe/
  watch/       archive index + one page per item
  shop/        store + product pages
  drops/       drop calendar
  cart/  success/  admin/  legal/
components/
  motion/      reveal primitives + the GSAP/Lenis runtime
  media/  shop/  site/  admin/
lib/
  data/        cached, tagged database reads
  providers/   YouTube · Twitch · TikTok · Instagram
  auth · commerce · env · http · log · schema · sync · stripe · supabase
supabase/migrations/    0001 core · 0002 commerce · 0003 catalog seed
tests/
  unit/        66 tests
  e2e/         Playwright, four viewport and motion profiles
```

---

## Notes for whoever picks this up

- **`lib/env.ts` is the only place `process.env` is read.** Secrets are
  behind getters that throw if touched from the browser.
- **Inventory ships at zero.** Stock is a fact about a warehouse; the seed
  migration will not assert one. Everything reads *Sold out* until you
  enter real counts.
- **There is no seeded drop.** The drop calendar is empty until you create
  one in the control room, because a countdown to an invented date is a
  lie in the most prominent component on the site.
- **There is no demo checkout.** Without Stripe configured, checkout
  returns 503 and says so.
- **`DECISIONS.md`** records every non-obvious call, what was rejected, and
  the risk that remains.
- **`EXECUTION_PLAN.md`** is the issue ledger: each defect, its fix, and
  the artifact that proves it.
