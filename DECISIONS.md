# Decisions

Non-obvious calls made during the rebuild. Each records the alternative
that was rejected and the risk that remains.

---

### Supabase is the only source of truth; no in-memory fallback

**Decision.** Every read comes from Postgres through a tagged cache. When
Supabase is not configured, pages render an honest empty state.

**Rejected.** Keeping a mock-data layer as a fallback (what the codebase
did before).

**Reason.** The fallback was indistinguishable from real content in the UI,
so a misconfigured deploy looked like a working store. It also made the
site depend on one serverless instance keeping a `globalThis` Map warm:
correct output on a warm instance, empty on a cold one, with no way to tell
which you were looking at.

**Risk.** A Supabase outage empties the site rather than showing stale
content. Mitigated by a 5-minute cache: an outage shorter than the cache
window is invisible.

---

### The catalog is seeded with zero inventory

**Decision.** `0003_catalog_seed.sql` inserts the merchandising copy but
every variant starts at `inventory_count = 0`, so the storefront reads
**Sold out** until the operator enters real counts.

**Rejected.** Seeding plausible stock numbers so the store looks open.

**Reason.** Stock is a fact about a warehouse. A seeded `142` is a number
the site would be asserting without knowing it, and it is exactly the kind
of placeholder that survives to production because it looks fine.

**Risk.** A reviewer opening the deployed site before stock is entered sees
an entirely sold-out store. This is documented as step 5 of the first
deploy in the runbook.

---

### No drops are seeded

**Decision.** There is no drop anywhere in the codebase. `/drops` renders
an empty calendar plus a signup form until one is created in the control
room.

**Rejected.** Shipping a demo drop dated a few days out.

**Reason.** A countdown to an invented date is a lie told in the most
prominent component on the site, and it silently becomes an expired drop
the moment nobody resets it.

**Risk.** The drop page looks sparse on first visit. The empty state is
designed rather than blank, and it converts — it carries the signup form.

---

### Stock is reserved before Stripe is called, not after

**Decision.** Checkout mints a `checkout_ref`, calls `reserve_inventory`,
and only then creates the Stripe session. If session creation fails, the
hold is released.

**Rejected.** Decrementing on `checkout.session.completed` only.

**Reason.** Decrementing at webhook time means two shoppers can both reach
the payment page for the last unit and both pay. Reserving first makes the
availability re-check happen inside the row lock, so the second shopper is
told it is gone before they enter a card.

**Risk.** A hold outlives its session if both the webhook and the cron
sweep fail. `expires_at` plus the sweep on every cron tick bounds this to
roughly one cron interval.

---

### Idempotency lives in the database, not the route handler

**Decision.** `commit_purchase` inserts the Stripe event id and writes the
order in one transaction; a duplicate id short-circuits and returns the
existing order.

**Rejected.** Checking "does an order exist for this session?" in the route
before writing.

**Reason.** That check is a race. Stripe retries for three days and can
deliver concurrently; two handlers can both read "no order" and both write.
A primary key on the event id cannot.

**Risk.** None identified. Replay is covered by `scripts/db-verify.sh`.

---

### Admin auth is a signed stateless cookie, verified in edge middleware

**Decision.** `ADMIN_PASSWORD` is compared in constant time, then an
HMAC-SHA256 token goes into an httpOnly cookie. Middleware verifies it
before any admin route renders.

**Rejected.** Supabase Auth, and the previous `sessionStorage` flag against
a `NEXT_PUBLIC_` passcode.

**Reason.** The old gate shipped the passcode in the client bundle and let
anyone set the flag from the console. Supabase Auth is the right answer for
many accounts; for one operator it adds a table, a provider and a
round-trip per request. A stateless token verifies with no I/O, so the gate
runs in middleware — the admin HTML is never generated for an
unauthenticated visitor, rather than being sent and then hidden.

**Risk.** No server-side revocation list: a stolen token is valid until it
expires (12 hours). Rotating `ADMIN_SESSION_SECRET` invalidates everything
immediately.

---

### There is no demo checkout mode

**Decision.** Without `STRIPE_SECRET_KEY`, `/api/stripe/checkout` returns
503 and the cart says checkout is unavailable.

**Rejected.** The previous behaviour: redirecting to `/success?demo=true`.

**Reason.** A success page reachable without payment is the worst possible
default. It also meant `/success` had a branch that rendered a receipt
based on a URL parameter.

**Risk.** None. An unconfigured store says so.

---

### Filtering is URLs, not client state

**Decision.** `/watch?source=youtube` and `/shop?category=apparel` are
server-rendered links.

**Rejected.** `useState` filters in a client component (the previous
approach).

**Reason.** The archive is the organic acquisition surface. Client-side
filtering means one indexable page instead of five, no shareable filtered
view, and a back button that does nothing. It also forced the whole page to
be a client component that fetched its own data after hydration.

**Risk.** A filter click is a navigation, not an instant swap. With the
page cached, that is a fast server round-trip.

---

### Video players are facades

**Decision.** `/watch/{source}/{id}` renders a poster with a play button.
The provider iframe mounts on click.

**Rejected.** Embedding the iframe on load.

**Reason.** A YouTube or Twitch embed is roughly a megabyte of third-party
script and several cookies, on a page most visitors scroll past.

**Risk.** One extra click to play. The poster reserves the exact box the
iframe fills, so nothing shifts.

---

### Live status is polled by cron, not by the browser

**Decision.** A single `live_status` row is refreshed every five minutes by
`/api/sync/live`. Pages read the row.

**Rejected.** The previous `/api/live` endpoint polled every 30 seconds
from the client.

**Reason.** Client polling means a Twitch API call per visitor per 30
seconds, work in every backgrounded tab, and a page that cannot be static.

**Risk.** The banner can be up to five minutes stale. For "this person is
streaming right now", that is fine.

---

### A failed live probe does not flip the banner to offline

**Decision.** If the Twitch probe errors, the previous `live_status` row is
left alone and the run is recorded as failed.

**Rejected.** Writing `is_live = false` on any failure.

**Reason.** A transient API error would hide a stream that is actually
running — the one moment the banner matters most.

**Risk.** If a stream ends during a Twitch outage, the banner stays up
until the next successful probe.

---

### One accent colour, two calibrated tints

**Decision.** `--blade` (`#c8102e`) is for fills and large display type
only. Small accent text uses `--blade-text` (`#e8556b`).

**Rejected.** Using the brand red for everything, as before.

**Reason.** `#c8102e` on `#0a0a0a` measures 3.4:1 — below AA for normal
text, and it was being used for 0.7rem eyebrow labels throughout. The
lighter tint measures 5.6:1 and reads as the same accent.

**Risk.** Two reds exist in the token set. Their roles are documented at
the top of `globals.css` and neither is used outside its role.

---

### Reveal state is CSS; JavaScript only adds a class

**Decision.** `[data-reveal]` starts hidden in CSS, and a `.no-js` class on
`<html>` (removed on hydration) makes it visible when scripts do not run.

**Rejected.** Animating from JavaScript alone, or rendering hidden and
revealing in an effect.

**Reason.** Either approach means content is invisible if the motion bundle
fails to load. This way the failure mode is "no animation", not "no page" —
verified by a Playwright test with JavaScript disabled.

**Risk.** A flash of the pre-reveal state is possible on a very slow
hydration. The class swap happens in the first effect, before paint in
practice.

---

### Smooth scrolling is opt-out by capability, not a toggle

**Decision.** Lenis initialises only on `(pointer: fine)` and only when
`prefers-reduced-motion` is not set. GSAP and Lenis are dynamic imports, so
neither is in the bundle for a visitor with reduced motion.

**Rejected.** Smooth scroll everywhere; a UI toggle.

**Reason.** Touch devices already have good native scroll physics, and
overriding it feels broken. Reduced motion is a real preference, not a
setting to duplicate in the page.

**Risk.** Two scroll behaviours exist depending on input device. The wheel
still moves one notch per notch — this is easing, not scroll-jacking.

---

### Playwright tests assert the empty state when data is absent

**Decision.** The e2e suite passes with or without Supabase and Stripe
configured. Where data would be needed, it asserts the honest empty state
instead of skipping.

**Rejected.** Skipping those tests when unconfigured.

**Reason.** The unconfigured path is the one a first deploy actually hits.
A skipped test proves nothing about it.

**Risk.** Some assertions are weaker than they would be with a seeded
database. `scripts/db-verify.sh` covers the data-dependent guarantees
against real Postgres instead.

---

### `vercel.json` pins the framework

**Decision.** `"framework": "nextjs"` plus the build and install commands
are committed.

**Rejected.** Relying on the project's dashboard settings.

**Reason.** The project had no framework preset, so Vercel served the build
output as static files and every route returned 404 despite a green build.
Configuration that the deployment depends on belongs in the repository.

**Risk.** A dashboard override could still conflict; `vercel.json` wins for
the keys it sets.

---

### Next 16 / React 19

**Decision.** Upgraded from Next 14.2.15.

**Rejected.** Staying on the 14.2 line and patching.

**Reason.** `npm audit` reported a critical advisory against every `next`
below 16.3.1. Nothing on the 14.x line clears it.

**Risk.** A major-version jump. Mitigated by the fact that essentially
every page was rewritten anyway, and by the full suite passing on the
production build.
