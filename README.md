# WockkingDagger — Official Hub

The official hub. Releases, drops, video archive, store. Built in Next.js 14, Tailwind, TypeScript. Designed to run immediately on mock data, then upgrade to live Supabase + Stripe + social APIs as credentials are added.

## Stack

- **Next.js 14** (App Router, Server Components first)
- **TypeScript** strict
- **Tailwind CSS** with custom dark digital design tokens
- **Supabase** for posts, products, drops, subscribers, orders
- **Stripe** for checkout
- **YouTube Data API v3**, **TikTok Display API**, **Instagram Graph API** for auto-sync

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The whole site is functional out of the box, fed by seeded mock data in `/lib/mock-data.ts`. No credentials required.

## Admin

Visit `/admin`. Default passcode is `dagger` (set via `NEXT_PUBLIC_ADMIN_PASSCODE`). The control room has tabs for posts, products, drops, and manual sync triggers. Swap the passcode gate for Supabase Auth or Clerk before going live.

## Upgrade path — wiring it up

### 1. Supabase

1. Create a Supabase project.
2. Run `/supabase/schema.sql` in the SQL editor.
3. Run `/supabase/seed.sql` for demo content (optional).
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

The mock-data layer stays in place as a fallback. To switch reads to live Supabase, refactor `lib/mock-data.ts` helpers to call the Supabase client when `SUPABASE_CONFIGURED` is true.

### 2. Stripe

1. Create a Stripe account, grab test keys.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`.
3. (Recommended) Add a webhook handler at `/app/api/stripe/webhook/route.ts` to persist orders to Supabase on `checkout.session.completed`. Set `STRIPE_WEBHOOK_SECRET`.

Without `STRIPE_SECRET_KEY`, the checkout button still works but redirects to `/success?demo=true` so you can demo the full flow.

### 3. Social syncs

Each platform has its own quirks:

- **YouTube** — easiest. Get an API key from Google Cloud Console, find your uploads playlist ID (`UU` + channel ID minus `UC`), set `YOUTUBE_API_KEY` and `YOUTUBE_UPLOADS_PLAYLIST_ID`.
- **Instagram** — needs a Business or Creator account linked to a Facebook Page, then a long-lived access token via the Graph API. Tokens expire every 60 days, so schedule a refresh job.
- **TikTok** — needs Developer Portal approval, which can take weeks. Manual fallback: paste permalinks straight into the `posts` table.

Trigger syncs from `/admin` or POST to `/api/sync/youtube`, `/api/sync/tiktok`, `/api/sync/instagram`. In production, run these from Vercel Cron every 1 to 6 hours.

## Architecture notes

- **Mock-first data layer.** `lib/mock-data.ts` exports typed helpers that mirror eventual Supabase queries. Every page reads through these helpers. Swapping to live data is a one-file refactor.
- **Provider adapters.** `lib/providers/*.ts` normalize YouTube, TikTok, and Instagram responses into the same `Post` shape, then upsert to Supabase from the sync routes.
- **Graceful fallback everywhere.** Stripe missing? Demo checkout. Supabase missing? Mock data. Social API missing? Returns `{ configured: false }` cleanly.
- **Server components by default.** Client components only where they earn it: nav, video card play state, buy button, admin tabs, watch/shop filters.
- **Type-safe end to end.** `types/index.ts` is the contract. Every mock, every provider, every component conforms.

## Design system

- **Fonts** — Anton (display), Manrope (body), JetBrains Mono (UI/operator).
- **Palette** — `ink` (#0a0a0a) base, `bone` (#f5f1ea) text, `blade` (#c8102e) crimson accent, `gold` (#c9a24a) tertiary.
- **Texture** — Subtle SVG grain overlay on the body (`.grain` class) for film feel.
- **Motion** — Staggered fade-up reveals on hero, marquee on top strip, custom easing throughout. Respects `prefers-reduced-motion`.

## What's intentionally left for you

- Replace SVG placeholders in `/public/placeholders/` with real product photography and video thumbnails.
- Drop the WockkingDagger logo mark into `components/Navigation.tsx` (currently a generic blade SVG).
- Wire the Stripe webhook handler for real order persistence.
- Replace the passcode admin gate with proper auth.
- Add OG image generation for share cards (Next.js has built-in `@vercel/og`).
- Generate `sitemap.xml` and `robots.txt`.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage with hero, next drop, shop strip, watch strip, manifesto |
| `/watch` | Filterable video archive (YouTube / TikTok / Instagram) |
| `/shop` | Filterable product grid |
| `/shop/[slug]` | Product detail with checkout |
| `/drops` | Calendar: upcoming, live, archived |
| `/success` | Post-checkout confirmation (live or demo) |
| `/admin` | Passcode-gated control room |
| `/api/stripe/checkout` | Create Stripe checkout session (or demo fallback) |
| `/api/subscribe` | Email + SMS capture with rate limiting + honeypot |
| `/api/sync/youtube` | Pull YouTube uploads, upsert to Supabase |
| `/api/sync/tiktok` | Pull TikTok videos, upsert to Supabase |
| `/api/sync/instagram` | Pull Instagram media, upsert to Supabase |

## License

All rights reserved.
