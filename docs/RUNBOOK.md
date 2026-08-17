# Operator runbook

Everything needed to run this site without reading the source.

---

## 1. First deploy

1. **Create the database.** In the Supabase SQL editor, run every file in
   `supabase/migrations/` in filename order. They are re-runnable, so a
   repeat is harmless.

2. **Set the environment variables.** Copy the list from `.env.example`
   into the Vercel project (Settings → Environment Variables). Every
   variable there states what breaks without it. The minimum for a
   working store is:

   | Variable | Why |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | canonicals, sitemap, Stripe redirects |
   | `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | page reads |
   | `SUPABASE_SERVICE_ROLE_KEY` | sync, webhook, admin writes |
   | `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | control-room access |
   | `CRON_SECRET` | scheduled syncs |
   | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | taking money |

   Generate the two secrets:
   ```bash
   openssl rand -base64 48   # ADMIN_SESSION_SECRET
   openssl rand -hex 32      # CRON_SECRET
   ```

3. **Point Stripe at the webhook.** Stripe dashboard → Developers →
   Webhooks → add endpoint `https://<your-domain>/api/stripe/webhook`,
   subscribed to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

4. **Deploy.** `vercel.json` pins the framework, the build command and
   the cron schedule, so nothing depends on dashboard settings.

5. **Set your stock.** Sign in at `/admin`, open **Inventory**, and enter
   real unit counts. The catalog ships at zero on purpose — until you do
   this, every product correctly reads **Sold out**.

---

## 2. Deploying

Production tracks `main`. A push builds and promotes automatically.

```bash
npm run verify        # typecheck + lint + unit tests + production build
npm run test:e2e      # Playwright against a real production build
scripts/db-verify.sh  # migrations + commerce guarantees, needs local Postgres
```

`npm run verify` is the gate. If it passes, the deploy will build.

**Rolling back:** Vercel → Deployments → pick the last good production
deployment → *Promote to Production*. Rolling back code does not roll back
the database; migrations are additive and safe to leave in place.

---

## 3. Sync

Content is pulled on a schedule by Vercel Cron (see `vercel.json`):

| Route | Schedule | What it does |
|---|---|---|
| `/api/sync/live` | every 5 min | Twitch live status → the site banner |
| `/api/sync/youtube` | hourly at :17 | uploads from both channels |
| `/api/sync/twitch` | hourly at :32 | the VOD archive |
| `/api/sync/tiktok` | every 6h at :47 | TikTok posts |
| `/api/sync/instagram` | every 6h at :52 | Instagram posts |

Every run also releases inventory held by checkout sessions that were
abandoned.

**Running one by hand:** `/admin` → **Sync** → *Run sync*. The buttons hit
the same endpoints; they work because your browser carries the admin
session cookie.

**From a terminal:**
```bash
curl -X POST https://<your-domain>/api/sync/youtube \
  -H "Authorization: Bearer $CRON_SECRET"
```

Without that header, or a valid admin cookie, these endpoints return 401.
They are never publicly callable.

**Checking the last runs:** `/admin` → **Sync** → *Recent runs*. Each row
shows the source, item count, duration, and any error.

A provider failure never empties the archive: rows are upserted, so a bad
run leaves yesterday's content in place.

---

## 4. Adding a product

The catalog lives in Postgres. To add a product, insert a row and at least
one variant:

```sql
insert into products
  (id, slug, name, tagline, description, price_cents, currency,
   image_urls, category, active, position)
values
  ('prod_new_thing', 'new-thing', 'NEW THING', 'One line of copy.',
   'The full description.', 9500, 'USD',
   array['/product/new-thing.svg'], 'apparel', true, 70);

-- Apparel: one row per size. Everything else: a single ONE_SIZE row.
insert into product_variants (id, product_id, size, sku, position) values
  ('var_new_thing_s',  'prod_new_thing', 'S',  'WD-NEW-S',  10),
  ('var_new_thing_m',  'prod_new_thing', 'M',  'WD-NEW-M',  20),
  ('var_new_thing_l',  'prod_new_thing', 'L',  'WD-NEW-L',  30);
```

Then set the stock in `/admin` → **Inventory**. New variants start at zero,
so the product shows as sold out until you do.

Product images go in `public/product/`. Replace the shipped placeholder
graphics with real photography and update `image_urls` to match.

Hiding a product is a toggle: `/admin` → **Products** → *Live / Hidden*. A
hidden product leaves the storefront, the sitemap, and RLS stops the public
key reading it at all.

---

## 5. Running a drop

1. `/admin` → **Drops** → *New drop*.
2. Fill in the name, slug, opening time and (optionally) a closing time.
   Times are entered in your local timezone and stored as UTC.
3. Tick the products that belong to the drop.
4. Leave **Publish** off while you are drafting. Tick it when ready.

Status is derived from the clock every time a page renders — `upcoming`
before the open time, `live` between open and close, `ended` after. There
is no job to run and no status field that can go stale, so the countdown
hitting zero opens the drop by itself.

Make sure the drop's products have stock before it opens.

---

## 6. Taking payment

The flow, end to end:

1. Shopper adds a **variant** (product + size) to the cart. The cart in
   the browser holds identifiers and quantities only — never a price.
2. `/cart` re-resolves everything server-side and tells the shopper about
   anything that changed while they were away.
3. Checkout resolves prices from the database, **holds** the stock under a
   `checkout_ref`, then creates the Stripe session. Holding first is what
   stops two shoppers reaching payment for the same last unit.
4. Stripe takes the payment on its own hosted page. Card details never
   touch this site.
5. The webhook verifies the signature, records the event id, writes the
   order, and converts the hold into a real decrement — all in one
   transaction. A replayed delivery is a no-op.
6. `/success` retrieves the session from Stripe and requires
   `payment_status === "paid"` before showing a receipt. A hand-typed URL
   shows the unconfirmed state.

If a shopper abandons checkout, the hold expires after 35 minutes and the
next cron tick puts the stock back.

**Refunds** are issued in the Stripe dashboard. Set the order's status to
`refunded` and return the stock manually:

```sql
update orders set status = 'refunded' where stripe_session_id = 'cs_...';
update product_variants set inventory_count = inventory_count + 1
 where id = 'var_...';
```

---

## 7. Rotating secrets

| Secret | How | Effect |
|---|---|---|
| `ADMIN_PASSWORD` | change the env var, redeploy | old passcode stops working |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 48`, redeploy | every session signed out |
| `CRON_SECRET` | `openssl rand -hex 32`, redeploy | Vercel Cron picks it up automatically |
| `STRIPE_SECRET_KEY` | roll in Stripe, update, redeploy | roll the restricted key, not the account |
| `STRIPE_WEBHOOK_SECRET` | roll the endpoint secret, update, redeploy | deliveries fail until updated — do it quickly |
| `SUPABASE_SERVICE_ROLE_KEY` | rotate in Supabase, update, redeploy | sync and webhooks fail until updated |
| `INSTAGRAM_ACCESS_TOKEN` | long-lived tokens expire every 60 days | Instagram sync starts failing in `sync_runs` |

Set the new value in Vercel **before** invalidating the old one wherever
you can, then redeploy.

---

## 8. Reading the monitoring

**Sync health** — `/admin` → **Sync** → *Recent runs*. Rows marked `failed`
carry a short reason. `not configured` means the credentials are absent,
which is a state, not a fault.

**Logs** — every server event is one line of JSON with a `level` and an
`event`, so `vercel logs` filters cleanly:

```
checkout.created        a Stripe session was opened
webhook.order_recorded  an order was written and stock decremented
webhook.bad_signature   a forged or misconfigured delivery
webhook.released        an abandoned checkout gave its stock back
admin.login.failed      a wrong passcode
sync.ok / sync.skipped  a scheduled run
subscribe.created       a new mailing-list entry
```

Anything logged as an error carries a short `ref`. The same `ref` is
returned to the caller, so a support message quoting it points straight at
the log line. Secrets are redacted before anything is written.

**Errors** — set `SENTRY_DSN` and errors are forwarded there too.

**Funnel** — Vercel Analytics receives custom events along the purchase
path: `view_product → add_to_cart → view_cart → begin_checkout →
checkout_redirected → purchase_confirmed`, plus `checkout_rejected` when
the server refuses. Drop-off between any two answers "where is the money
leaking". Signups emit `signup_submitted / _succeeded / _failed`.

**Stock sanity** — `/admin` → **Overview** shows *Units in stock* and
*Units held*. A large held figure that does not fall is a stuck reservation;
the sweep runs on every cron tick, so check that cron is firing.

---

## 9. Local development

```bash
npm ci
cp .env.example .env.local     # fill in what you need
npm run dev
```

The site runs without any credentials — every data-backed surface renders
its empty state instead of inventing content.

For webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

To verify the database logic against a real Postgres:
```bash
scripts/db-verify.sh            # defaults to /tmp:5433
scripts/db-verify.sh localhost 5432
```
