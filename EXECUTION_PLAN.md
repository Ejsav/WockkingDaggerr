# Execution plan and issue ledger

The audit placeholder in the brief arrived unsubstituted (`{{AUDIT}}`), so
the defect register below was derived from the repository itself and
confirmed with the operator before work began. Every item states the file
it lived in, the fix, and the artifact that proves it.

Verification commands referenced throughout:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run test           # vitest — 66 unit tests
npm run build          # production build
npm run test:e2e       # playwright — 286 tests across 4 viewport/motion profiles
scripts/db-verify.sh   # 19 assertions against real Postgres
npm audit              # 0 vulnerabilities
```

---

## P0 — security

| # | Issue | Was | Fix | Proof |
|---|---|---|---|---|
| S1 | Admin passcode in the client bundle | `app/admin/page.tsx` read `NEXT_PUBLIC_ADMIN_PASSCODE` with the default `"dagger"` | `ADMIN_PASSWORD` is server-only, compared in constant time; session is an HMAC-signed httpOnly cookie (`lib/auth.ts`) | `tests/e2e/security.spec.ts` greps every downloaded chunk for nine secret names and the old storage key |
| S2 | Auth was `sessionStorage` theatre | `sessionStorage.setItem("wd_admin_gate","1")` | Signed token verified in edge `middleware.ts` before any admin route runs | e2e: `/admin` and `/admin/anything/deep` redirect; a forged cookie is refused |
| S3 | Admin content rendered then hidden | client component decided after paint | Gate is in middleware, so admin HTML is never generated for an anonymous visitor | e2e asserts *Units in stock*, *Revenue*, *Sign out* are absent from the response body |
| S4 | Sync endpoints publicly callable | `POST /api/sync/*` had no auth | `authorizeSync()` requires the cron bearer or an admin session | e2e: 12 assertions (GET and POST × 6 sources) all 401 |
| S5 | Success derived from a URL parameter | `?demo=true` / `?session_id=` rendered a receipt | `/success` retrieves the session from Stripe and requires `payment_status === "paid"` | e2e: hand-typed and `?demo=true` both show the unconfirmed state |
| S6 | Demo checkout bypassed payment | checkout returned `/success?demo=true` with no Stripe key | Returns 503; there is no demo mode | e2e + `app/api/stripe/checkout/route.ts` |
| S7 | Database errors leaked to callers | `NextResponse.json({ error: error.message })` | `publicError()` returns a message and a correlation `ref`; detail goes to logs | e2e asserts no `supabase|postgres|relation|stack` in error bodies |
| S8 | No input validation | routes trusted body shape | zod schemas on every route with a body | `tests/unit/commerce.test.ts` — 9 hostile-input cases |
| S9 | Client could influence price | checkout read the client cart | `resolveCart()` reads price, name and size from the database | unit test asserts client price fields are stripped; e2e posts a forged price |
| S10 | Critical dependency advisory | `next@14.2.15` | Next 16.3.1, React 19, `npm audit fix` | `npm audit` → 0 vulnerabilities |
| S11 | No security headers | none set | CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; `x-powered-by` off | e2e asserts each header |
| S12 | No RLS on the real tables | schema had partial policies | RLS on every table; orders, subscribers, reservations and the event ledger have no anon policy at all | `db-verify.sh`: anon reads 0 rows from each, and cannot execute `commit_purchase` |

## P0 — architecture

| # | Issue | Was | Fix | Proof |
|---|---|---|---|---|
| A1 | Homepage blocked on provider pagination | module-scope `await Promise.all([autoSyncYouTube(), autoSyncTwitch()])` in `app/page.tsx` | Removed. Pages read Postgres only | `npm run build`: `/` is static with `revalidate 1m` |
| A2 | State in `globalThis` | `__wdPostCache`, `__wdMediaCache`, `__liveCache`, `__twitchToken` | Deleted. Postgres is the source of truth | no `globalThis` state remains outside a token cache nothing depends on |
| A3 | Browser triggered syncs | `/watch` POSTed to `/api/sync/*` on mount | Removed; cron only | e2e: sync routes 401 for a browser |
| A4 | Whole pages were client components | `/watch`, `/shop` were `"use client"` and fetched after hydration | Server components with ISR; filters are URLs | e2e renders `/watch` and `/` with JavaScript disabled |
| A5 | No timeouts on upstream calls | bare `fetch` | `fetchWithTimeout` — 8s cap, bounded retry with jittered backoff (`lib/http.ts`) | every provider call routes through it |
| A6 | No cache invalidation path | none | Tagged caches + `invalidate()` on every write | `lib/supabase.ts`, called from sync, webhook and all admin routes |
| A7 | Cold start showed nothing | depended on a warm instance | Nothing depends on process memory | build output + JS-disabled e2e |

## P0 — commerce

| # | Issue | Was | Fix | Proof |
|---|---|---|---|---|
| C1 | Size silently dropped | `BuyButton` sent `size`; the route's type ignored it | Size **is** the variant id, carried cart → reservation → webhook → order row | `db-verify.sh`: `line_items->0->>'size'` is `M` on the persisted order |
| C2 | No webhook at all | route did not exist | `/api/stripe/webhook`, signature verified | e2e: unsigned and bogus signatures rejected |
| C3 | Orders never persisted | nothing wrote to `orders` | `commit_purchase()` writes the order | `db-verify.sh` asserts exactly one row |
| C4 | Inventory never decremented | `inventory_count` was static mock data | Decremented inside the same transaction | `db-verify.sh`: inventory 0, reserved 0 after one sale of the last unit |
| C5 | Webhook replay would double-count | no idempotency | Event id is a primary key inserted before any effect | `db-verify.sh`: replay returns the same order id, one row, one decrement |
| C6 | Last-unit race | none | Stock is reserved before Stripe is called; the availability re-check is inside the row lock | `db-verify.sh`: second concurrent buyer rejected, `reserved_count` stays 1 |
| C7 | Partial reservation could leak stock | none | A failing line rolls back every hold in the call | `db-verify.sh` asserts `reserved_count = 0` after a partial failure |
| C8 | Abandoned checkouts held stock forever | none | 35-minute TTL plus `sweep_expired_reservations()` on every cron tick | `db-verify.sh`: sweep releases and is idempotent |
| C9 | No cart | buy-now only | Real cart, `localStorage` for identifiers only, re-resolved server-side | e2e: persistence, corruption, and a tampered price |
| C10 | Stale tab could submit against changed stock | none | Checkout returns 409 with what changed; the cart re-validates and says so | `app/api/stripe/checkout/route.ts`, `components/shop/CartView.tsx` |
| C11 | Double-click could double-charge | none | Stripe idempotency key = `checkout_ref`; the button disables | checkout route |
| C12 | Sold-out was cosmetic | derived from mock numbers | Derived from real variant stock; a sold-out product renders no purchase control | e2e asserts card and product page agree |

## P1 — data truth

| # | Issue | Fix | Proof |
|---|---|---|---|
| D1 | Rickroll video id `dQw4w9WgXcQ` seeded as content | `lib/mock-data.ts` deleted | e2e greps every page for it |
| D2 | Invalid video ids (`vid_002`, `vid_003`) | deleted | e2e |
| D3 | Fabricated view counts and dates | deleted; counts come from provider APIs | e2e greps for the seeded ids |
| D4 | Invented TikTok/Instagram post ids | deleted | e2e |
| D5 | Fabricated stream schedule | component deleted; replaced by real live status | `components/sections/StreamSchedule.tsx` removed |
| D6 | Invented stock numbers | catalog seeds at zero | `db-verify.sh` asserts no seeded variant carries stock |
| D7 | Permanently fake drop countdown | no drop is seeded anywhere | `/drops` renders an empty calendar |
| D8 | Admin buttons that did nothing | every control performs a persisted mutation | `/api/admin/{inventory,product,media,drop}` |
| D9 | Admin stats from mock arrays | live `count` queries | `lib/data/admin.ts` |

## P1 — SEO, accessibility, performance

| # | Issue | Fix | Proof |
|---|---|---|---|
| E1 | No canonical URLs | `alternates.canonical` on every route | e2e checks five routes |
| E2 | Sitemap listed redirects (`/watch/yt_*`) | Only canonical 200 URLs | e2e fetches every entry with `maxRedirects: 0` |
| E3 | Sitemap listed gated pages | `/admin`, `/api`, `/cart`, `/success` excluded | e2e |
| E4 | No structured data | `VideoObject`, `Product`+`Offer`, `Person`+`sameAs`, `BreadcrumbList`, `Event`, `CollectionPage` | 19 unit tests in `tests/unit/schema.test.ts` + e2e parse check |
| E5 | Archive not indexable | server-rendered; one page per item; filters are URLs | JS-disabled e2e |
| E6 | Render-blocking Google Fonts `@import` | `next/font` self-hosts and inlines | `app/layout.tsx` |
| E7 | Raw `<img>` everywhere | `next/image` with `sizes`, AVIF/WebP, fixed aspect boxes | `MediaCard`, `ProductCard`, product page |
| E8 | 30-second client polling | removed; cron writes a row | `LiveBanner` is a server component |
| E9 | Countdown ran in hidden tabs | interval stops on `visibilitychange` | `components/site/Countdown.tsx` |
| E10 | Accent red failed AA on small text | `--blade-text` at 5.6:1 for text; the fill red is fills-only | contrast table in `globals.css` |
| E11 | Body text at 30–40% opacity | tertiary floor is 58% (6.7:1) | token set |
| E12 | Mobile menu links focusable while hidden | `hidden` attribute; focus trap; Escape restores focus | e2e |
| E13 | **Mobile menu collapsed to zero height** | the header's `backdrop-filter` made it the containing block for the `fixed` panel; moved the panel outside `<header>` | found by e2e, now asserted |
| E14 | Tap targets under 44px | wordmark, skip link and footer email raised | e2e measures every link and button at 320px |
| E15 | No skip link | first tab stop on every page | e2e tabs once and activates it |
| E16 | Zoom not guaranteed | `maximumScale: 5`, no `user-scalable=no` | e2e |
| E17 | Mobile was collapsed desktop | designed at 320/360/390 | e2e runs three viewport projects |

## P2 — correctness

| # | Issue | Fix | Proof |
|---|---|---|---|
| F1 | `formatDuration` showed `184:11` for a 3-hour VOD | hours segment added | unit test |
| F2 | `formatDuration(0)` returned `""` | returns `0:00` | unit test |
| F3 | `parseTwitchDuration` matched the empty string, returning 0 | anchored regex, returns `null` | unit test |
| F4 | `parseIsoDuration` returned 0 for junk — marking videos as Shorts | anchored, returns `null` | unit test |
| F5 | `formatRelativeDate` rendered `-3d ago` for future dates | falls back to an absolute date | unit test |
| F6 | `formatDate` could render `Invalid Date` | returns `""`; UTC-pinned so server and client agree | unit test |
| F7 | `formatPrice` mixed `$185` and `$185.50` | always two decimals | unit test |
| F8 | `posts.platform` check constraint omitted `twitch` | schema replaced | migrations |
| F9 | Duplicate subscriber returned a raw 500 | treated as success; no enumeration oracle | `app/api/subscribe/route.ts` |
| F10 | `getCountdown` produced NaN for a bad date | returns `done: true` | unit test |
| F11 | Drop status computed twice per render | derived once at read time | `lib/data/catalog.ts` |
| F12 | `robots.txt` used the non-standard `host` field | removed | `app/robots.ts` |
| F13 | React 19: setState inside effect bodies | cart uses `useSyncExternalStore`; nav adjusts state during render | `npm run lint` clean |

## Preserved

Named as existing strengths and deliberately kept: YouTube `nextPageToken`
pagination and batched detail enrichment; Twitch cursor pagination; the
Twitch app-token cache; server-side price resolution at checkout;
thumbnail fallback chains; derived drop status; the ink / bone / blade
palette and the aggressive editorial typography.

---

## Target architecture

```
Vercel Cron ──bearer──▶ /api/sync/{source}  ─▶ providers (timeout + retry)
                                │
                                ▼
                        Postgres (Supabase)          ◀── /api/admin/* (session)
                     media_items · products                     │
                     product_variants · drops                   │
                     orders · reservations                      │
                     stripe_events · subscribers                │
                                │                               │
                        invalidate(tag)  ◀──────────────────────┘
                                │
                                ▼
                    tagged cache ─▶ server components ─▶ ISR
                                                          │
Stripe ──signed webhook──▶ commit_purchase() ─────────────┘
```

No provider call happens in a request path. No feature depends on a
serverless instance retaining memory.

## Migrations

| File | Contents |
|---|---|
| `0001_core.sql` | `media_items`, `drops`, `live_status`, `subscribers`, `sync_runs`; RLS; `updated_at` trigger |
| `0002_commerce.sql` | `products`, `product_variants`, `orders`, `inventory_reservations`, `stripe_events`; `reserve_inventory`, `release_reservation`, `commit_purchase`, `sweep_expired_reservations`; RLS; function grants revoked from anon |
| `0003_catalog_seed.sql` | Merchandising copy and the size run. Zero inventory, by design. |
