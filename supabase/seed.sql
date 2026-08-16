-- ============================================================
-- WOCKKINGDAGGER HUB — SEED DATA
-- Run after schema.sql to populate demo content.
-- Matches the shape of /lib/mock-data.ts so the live and mock
-- modes behave identically.
-- ============================================================

-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------
insert into public.posts (id, platform, external_id, title, description, thumbnail_url, embed_url, permalink, posted_at, duration_seconds, view_count, visible, tags)
values
  ('post_yt_01', 'youtube', 'dQw4w9WgXcQ', 'BLADE WORK — A Visual Manifesto',
   'Six minutes inside the world of WockkingDagger. Studio cuts, street footage, voiceover.',
   '/placeholders/thumb-1.svg', 'https://www.youtube.com/embed/dQw4w9WgXcQ',
   'https://youtube.com/watch?v=dQw4w9WgXcQ',
   '2026-05-12T14:00:00Z', 372, 184320, true, '{manifesto,long-form}'),

  ('post_yt_02', 'youtube', 'vid_002', 'Studio Diary 04 — Pressure Makes The Edge',
   'Behind the next drop. Late nights, raw footage, no filter.',
   '/placeholders/thumb-2.svg', 'https://www.youtube.com/embed/vid_002',
   'https://youtube.com/watch?v=vid_002',
   '2026-05-04T19:30:00Z', 528, 92110, true, '{studio-diary}'),

  ('post_yt_03', 'youtube', 'vid_003', 'On Building A Brand In Hostile Territory',
   'Long-form. The story so far.',
   '/placeholders/thumb-3.svg', 'https://www.youtube.com/embed/vid_003',
   'https://youtube.com/watch?v=vid_003',
   '2026-04-22T12:00:00Z', 1142, 67800, true, '{essay}'),

  ('post_tt_01', 'tiktok', '7341234567890123456',
   'When the drop hits and the server doesn''t.', null,
   '/placeholders/thumb-4.svg', 'https://www.tiktok.com/embed/v2/7341234567890123456',
   'https://www.tiktok.com/@wockkingdagger/video/7341234567890123456',
   '2026-05-18T22:15:00Z', 38, 412000, true, '{short}'),

  ('post_tt_02', 'tiktok', '7341234567890999999',
   'Three minutes of footage, one second of magic.', null,
   '/placeholders/thumb-5.svg', 'https://www.tiktok.com/embed/v2/7341234567890999999',
   'https://www.tiktok.com/@wockkingdagger/video/7341234567890999999',
   '2026-05-16T17:42:00Z', 22, 188000, true, '{short,studio}'),

  ('post_ig_01', 'instagram', 'DA1B2C3D4E5',
   'Crown of the season.', null,
   '/placeholders/thumb-6.svg', 'https://www.instagram.com/p/DA1B2C3D4E5/embed',
   'https://www.instagram.com/p/DA1B2C3D4E5/',
   '2026-05-20T09:00:00Z', null, 56000, true, '{editorial}'),

  ('post_ig_02', 'instagram', 'DA9X8Y7Z6W5',
   'Backstage. Final pass.', null,
   '/placeholders/thumb-7.svg', 'https://www.instagram.com/p/DA9X8Y7Z6W5/embed',
   'https://www.instagram.com/p/DA9X8Y7Z6W5/',
   '2026-05-15T20:30:00Z', null, 33400, true, '{editorial,behind-the-scenes}'),

  ('post_ig_03', 'instagram', 'DA5R4T3Y2U1',
   'Workshop floor. Smoke. Steel.', null,
   '/placeholders/thumb-8.svg', 'https://www.instagram.com/p/DA5R4T3Y2U1/embed',
   'https://www.instagram.com/p/DA5R4T3Y2U1/',
   '2026-05-09T11:15:00Z', null, 41200, true, '{editorial}')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
insert into public.products (id, slug, name, tagline, description, price_cents, currency, stripe_price_id, inventory_count, image_urls, category, active)
values
  ('prod_01', 'blade-hoodie-onyx', 'BLADE HOODIE — ONYX',
   'Heavyweight. Hand-cut. Limited run of 200.',
   '500gsm cotton fleece in pigment-dyed onyx. Crimson blade embroidery on the chest, foiled crest on the back. Garment-dyed for fade-in-time character. Cut oversized in the body, ribbed cuffs and hem.',
   18500, 'USD', null, 142, '{/placeholders/product-1.svg}', 'apparel', true),

  ('prod_02', 'dagger-tee-bone', 'DAGGER TEE — BONE',
   'Standard issue. Always restocked.',
   '240gsm heavyweight jersey. Boxy fit. Front-chest blade hit, back graphic in raised plastisol. Pre-washed for zero shrink.',
   6500, 'USD', null, 318, '{/placeholders/product-2.svg}', 'apparel', true),

  ('prod_03', 'crest-cap-black', 'CREST CAP — BLACK',
   'Embroidered six-panel. Strapback.',
   'Brushed cotton twill. Tonal stitching. Solid brass strap closure. Subtle crest at the front, blade strike at the back.',
   5500, 'USD', null, 96, '{/placeholders/product-3.svg}', 'headwear', true),

  ('prod_04', 'manifesto-poster-set', 'MANIFESTO POSTER SET',
   'Three-print collector set. Numbered.',
   'Three 18×24 prints on heavyweight matte stock. Each numbered out of 500. Edition closes when stock runs out. Ships flat in protective sleeve.',
   7500, 'USD', null, 421, '{/placeholders/product-4.svg}', 'print', true),

  ('prod_05', 'blade-chain-vault', 'BLADE CHAIN — VAULT EDITION',
   'Stainless dagger pendant. 22-inch box chain.',
   '316L stainless steel pendant on a 22-inch matte box chain. Hand-finished edge. Etched serial number on the reverse. 1 of 75.',
   24500, 'USD', null, 12, '{/placeholders/product-5.svg}', 'accessories', true),

  ('prod_06', 'studio-zine-issue-01', 'STUDIO ZINE — ISSUE 01',
   '64 pages. Saddle-stitched. Documented.',
   'First print issue. Behind the brand, the build, the early drops. Photography, essays, raw notes from the studio floor. Saddle-stitched, matte cover, uncoated interior.',
   3200, 'USD', null, 600, '{/placeholders/product-6.svg}', 'print', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- DROPS
-- ------------------------------------------------------------
insert into public.drops (id, slug, name, description, hero_image_url, drops_at, ends_at, status, product_ids)
values
  ('drop_03', 'drop-03-vault', 'DROP 03 — VAULT',
   'The vault opens once. The Blade Chain returns in 75 numbered pieces, the Onyx Hoodie re-runs at 200, and the first studio zine ships with every order. When the timer hits zero, the door closes.',
   '/placeholders/drop-hero.svg',
   now() + interval '3 days 11 hours',
   now() + interval '10 days',
   'upcoming',
   '{prod_05,prod_01,prod_06}'),

  ('drop_02', 'drop-02-bone', 'DROP 02 — BONE',
   'Standard issue restock. Always available, never explained.',
   '/placeholders/drop-hero-2.svg',
   now() - interval '14 days',
   null,
   'live',
   '{prod_02,prod_03,prod_04}'),

  ('drop_01', 'drop-01-origin', 'DROP 01 — ORIGIN',
   'The first one. Sold through. Documented in Issue 01.',
   '/placeholders/drop-hero-3.svg',
   now() - interval '92 days',
   now() - interval '80 days',
   'ended',
   '{}')
on conflict (id) do nothing;
