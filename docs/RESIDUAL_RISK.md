# Residual risk

What is not fixed, not verified, or could still fail. Ordered by what
would hurt most.

---

## Not verifiable in this environment

The build environment had **no credentials of any kind** — no Supabase
project, no Stripe keys, no YouTube/Twitch/TikTok/Instagram tokens. Three
claims therefore rest on code and proxies rather than a live run.

### 1. A real test-mode purchase has never been executed

**Status.** Unverified end to end.

**What *is* proven.** The database half runs against real Postgres in
`scripts/db-verify.sh` — 19 assertions covering the last-unit race, webhook
replay idempotency, single-order-per-session, exact-once decrement, size
reaching the order row, reservation rollback, the expiry sweep, and RLS.
The HTTP half is covered by Playwright for everything that does not need a
key: malformed carts, forged prices, unsigned webhooks, and the success
page refusing an unverified session.

**What is not proven.** That Stripe's live payloads match what the webhook
expects: the exact shape of `customer_details`, that `client_reference_id`
survives the round-trip, and that `checkout.session.expired` fires as
assumed.

**To close it.** With test keys set:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# buy something with 4242 4242 4242 4242, then:
select id, email, status, total_cents, line_items->0->>'size' from orders
 order by created_at desc limit 1;
select inventory_count, reserved_count from product_variants where id = '<the variant>';
stripe events resend <evt_id>   # must not create a second order
```

### 2. The provider HTTP paths have never hit a real API

**Status.** Partially verified.

`tests/unit/providers.test.ts` stubs `fetch` with the response shapes
YouTube and Twitch actually return and asserts pagination, mapping,
Shorts classification, thumbnail fallback, placeholder substitution,
private/deleted filtering, partial-page retention and failure handling.
That proves the handling is right *if* the shapes are right. It cannot
prove the APIs still return those shapes, and TikTok and Instagram have no
stubbed tests at all.

**Blast radius if wrong.** A sync fails and is recorded as failed in
`sync_runs`; the archive goes stale. It never empties — rows are upserted,
never truncated.

**To close it.** Set the credentials, run each sync from `/admin` → Sync,
and check the run log.

### 3. Nothing has been deployed to Vercel

**Status.** Blocked, and separate from this work.

Every URL on the project — the current production deployment, older
deployments that built cleanly, and the custom domain
`wockkingdaggerr.ericjokl.com` — returns `NOT_FOUND`. The builds are
green and produce correct Next.js output, so this is project
configuration, not code. The project reports `"framework": null`, which
means Vercel serves the build output as static files and matches no
routes.

`vercel.json` now pins `"framework": "nextjs"`, which should fix it — but
only once the file reaches a branch Vercel builds. Pushing this branch
produced no deployment at all, which suggests the Git integration is
scoped to `main` or is paused.

**To close it.** Merge to `main`, or set the framework preset in the
dashboard. Then confirm with a fetch of `/`.

---

## Known gaps, accepted

### Inventory ships at zero
Deliberate — see `DECISIONS.md`. Until an operator enters stock in
`/admin` → Inventory, the whole store reads *Sold out*. Anyone opening the
deployed site before that step sees a correct but empty shop.

### No drop exists until one is created
Deliberate. `/drops` shows an empty calendar and a signup form.

### Product images are placeholder graphics
`public/product/*.svg` are generated brand marks, not photography. They are
obviously graphics rather than fake product photos, but they are not the
real thing. Replace them and update `image_urls`.

### Legal pages use a derived contact address
Without `NEXT_PUBLIC_CONTACT_EMAIL` the pages fall back to
`support@<site-host>`. The policies are complete and specific, but three
facts a lawyer would want are not in them because they were not available:
the registered legal entity name, a registered address, and the governing
jurisdiction (currently phrased as "the jurisdiction in which
WockkingDagger operates"). **Anyone selling to consumers should have these
reviewed and the specifics filled in.**

### The mailing list has no delivery mechanism
Signups persist to `subscribers`. Nothing sends email or SMS — no ESP is
wired up. The form does not promise otherwise, but "first access" is only
true once something actually sends.

### Order fulfilment is manual
Orders land in the database and are visible in `/admin`. There is no
packing slip, no shipping label, no fulfilment status beyond
`paid → fulfilled → refunded`, and refunds are a Stripe action plus two SQL
statements (documented in the runbook).

---

## Ways this could still fail in production

### Money taken, order not recorded
If `commit_purchase` fails on every Stripe retry (three days), a customer
has paid with no order row. The failure is logged with a correlation ref
and Stripe's dashboard still has the payment, so it is recoverable by hand
— but it is not automatic. **Watch for `webhook.commit` errors.**

### Stock held by a stuck reservation
A hold is released by the `checkout.session.expired` webhook or by the
sweep on each cron tick. If both the webhook and cron are broken, holds
accumulate and stock silently becomes unbuyable. `/admin` → Overview shows
*Units held*; a figure that only grows is the symptom.

### Rate limiting is per-instance
`/api/subscribe` and `/api/admin/login` limit by IP in process memory.
Vercel runs many instances, so a distributed attacker gets one bucket per
warm instance. The unique constraints in Postgres keep the subscriber table
clean, and the login rate limit is a speed bump rather than a wall.
A shared limiter (Upstash) would close this.

### `/api/cart/validate` is unauthenticated and unlimited
It exposes only public catalog data and now uses the anon key rather than
the service role, so the worst case is enumerating variant ids that are
already public. It could still be used to generate database load.

### CSP still allows `'unsafe-inline'` for scripts
`'unsafe-eval'` has been removed. `'unsafe-inline'` remains because Next
inlines a bootstrap script and nonces are not wired through. This weakens
XSS defence-in-depth; the app has no user-generated HTML, so there is no
known injection vector today.

### Admin sessions cannot be revoked individually
The session token is stateless, so a stolen cookie is valid until it
expires (12 hours). Rotating `ADMIN_SESSION_SECRET` invalidates everything
at once, which is the only revocation available.

### The live banner can be five minutes stale
By design — cron refreshes every five minutes. A stream that ends during a
Twitch outage keeps the banner up until the next successful probe, because
a failed probe deliberately does not flip the banner to offline.

### Instagram tokens expire every 60 days
There is no auto-refresh. When it lapses, the Instagram sync starts failing
in `sync_runs` and Instagram content stops updating. Nothing else breaks.

---

## Measurements, and what they are worth

Core Web Vitals were measured on a local production build with buffered
`PerformanceObserver` entries (`scripts/measure-vitals.mjs`), median of
three runs per route, scrolling the full page so lazy content and
scroll-driven motion have a chance to shift layout:

| Route | LCP | CLS | TBT | Transfer |
|---|---|---|---|---|
| `/` | 148ms | 0 | 0ms | 315KB |
| `/watch` | 188ms | 0 | 0ms | 320KB |
| `/shop` | 144ms | 0 | 0ms | 320KB |
| `/drops` | 184ms | 0 | 0ms | 315KB |
| `/cart` | 188ms | 0 | 0ms | 315KB |

**Treat these as a floor, not a score.** Localhost has no network latency,
no CPU throttling, and — with no credentials — no images from remote CDNs
and no archive grid to lay out. Real-world LCP will be materially higher.
What the numbers do establish is that nothing in the motion system or the
layout causes shift: CLS is 0 everywhere, including after a full scroll.

One real defect was found this way and fixed: `/cart` measured 0.126 CLS
because a one-line Suspense fallback was replaced by a full cart, moving
the footer. The container now reserves the height.

**No Lighthouse run was performed** — the tooling was not available in the
environment. The measurements above are the substitute, and they cover
three of the metrics Lighthouse reports rather than its composite score.

**No like-for-like comparison against the Phase 0 baseline was run.** The
old build rendered seeded mock data and the new one renders empty states
without credentials, so the two would be measuring different amounts of
content and any comparison would flatter the new build. The architectural
claim — that the homepage no longer awaits YouTube and Twitch pagination at
module scope before rendering — is verifiable by reading the diff of
`app/page.tsx` rather than by a timing number.
