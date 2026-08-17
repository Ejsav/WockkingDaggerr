-- ============================================================
-- 0003 — CATALOG SEED
--
-- Merchandising copy for the storefront. Re-runnable: an upsert
-- refreshes copy and pricing without touching stock.
--
-- INVENTORY IS DELIBERATELY ZERO.
-- Stock is a fact about a warehouse, not something a migration
-- can know. Every variant ships at 0, so the storefront tells the
-- truth — SOLD OUT — until the operator enters real counts in the
-- control room (/admin → Inventory). See docs/RUNBOOK.md.
-- ============================================================

insert into public.products
  (id, slug, name, tagline, description, price_cents, currency, image_urls, category, active, position)
values
  ('prod_blade_hoodie_onyx', 'blade-hoodie-onyx', 'BLADE HOODIE — ONYX',
   'Heavyweight. Hand-cut. Limited run.',
   '500gsm cotton fleece in pigment-dyed onyx. Crimson blade embroidery on the chest, foiled crest on the back. Garment-dyed for fade-in-time character. Cut oversized in the body, ribbed cuffs and hem.',
   18500, 'USD', array['/product/blade-hoodie-onyx.svg'], 'apparel', true, 10),

  ('prod_dagger_tee_bone', 'dagger-tee-bone', 'DAGGER TEE — BONE',
   'Standard issue.',
   '240gsm heavyweight jersey. Boxy fit. Front-chest blade hit, back graphic in raised plastisol. Pre-washed for zero shrink.',
   6500, 'USD', array['/product/dagger-tee-bone.svg'], 'apparel', true, 20),

  ('prod_crest_cap_black', 'crest-cap-black', 'CREST CAP — BLACK',
   'Embroidered six-panel. Strapback.',
   'Brushed cotton twill. Tonal stitching. Solid brass strap closure. Subtle crest at the front, blade strike at the back.',
   5500, 'USD', array['/product/crest-cap-black.svg'], 'headwear', true, 30),

  ('prod_manifesto_posters', 'manifesto-poster-set', 'MANIFESTO POSTER SET',
   'Three-print collector set. Numbered.',
   'Three 18x24 prints on heavyweight matte stock. Each numbered by hand. Ships flat in a protective sleeve.',
   7500, 'USD', array['/product/manifesto-poster-set.svg'], 'print', true, 40),

  ('prod_blade_chain_vault', 'blade-chain-vault', 'BLADE CHAIN — VAULT EDITION',
   'Stainless dagger pendant. 22-inch box chain.',
   '316L stainless steel pendant on a 22-inch matte box chain. Hand-finished edge. Etched serial number on the reverse.',
   24500, 'USD', array['/product/blade-chain-vault.svg'], 'accessories', true, 50),

  ('prod_studio_zine_01', 'studio-zine-issue-01', 'STUDIO ZINE — ISSUE 01',
   '64 pages. Saddle-stitched. Documented.',
   'First print issue. Behind the brand, the build, the early drops. Photography, essays, raw notes from the studio floor. Saddle-stitched, matte cover, uncoated interior.',
   3200, 'USD', array['/product/studio-zine-issue-01.svg'], 'print', true, 60)

on conflict (id) do update set
  slug        = excluded.slug,
  name        = excluded.name,
  tagline     = excluded.tagline,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency    = excluded.currency,
  image_urls  = excluded.image_urls,
  category    = excluded.category,
  position    = excluded.position;

-- ------------------------------------------------------------
-- VARIANTS — apparel carries the size run, everything else gets a
-- single ONE_SIZE row so the checkout pipeline has one shape.
-- inventory_count stays at whatever is already there (0 on first run).
-- ------------------------------------------------------------
insert into public.product_variants (id, product_id, size, sku, position)
values
  ('var_blade_hoodie_onyx_s',   'prod_blade_hoodie_onyx', 'S',        'WD-HOOD-ONX-S',   10),
  ('var_blade_hoodie_onyx_m',   'prod_blade_hoodie_onyx', 'M',        'WD-HOOD-ONX-M',   20),
  ('var_blade_hoodie_onyx_l',   'prod_blade_hoodie_onyx', 'L',        'WD-HOOD-ONX-L',   30),
  ('var_blade_hoodie_onyx_xl',  'prod_blade_hoodie_onyx', 'XL',       'WD-HOOD-ONX-XL',  40),
  ('var_blade_hoodie_onyx_2xl', 'prod_blade_hoodie_onyx', '2XL',      'WD-HOOD-ONX-2XL', 50),

  ('var_dagger_tee_bone_s',     'prod_dagger_tee_bone',   'S',        'WD-TEE-BNE-S',    10),
  ('var_dagger_tee_bone_m',     'prod_dagger_tee_bone',   'M',        'WD-TEE-BNE-M',    20),
  ('var_dagger_tee_bone_l',     'prod_dagger_tee_bone',   'L',        'WD-TEE-BNE-L',    30),
  ('var_dagger_tee_bone_xl',    'prod_dagger_tee_bone',   'XL',       'WD-TEE-BNE-XL',   40),
  ('var_dagger_tee_bone_2xl',   'prod_dagger_tee_bone',   '2XL',      'WD-TEE-BNE-2XL',  50),

  ('var_crest_cap_black_os',    'prod_crest_cap_black',   'ONE_SIZE', 'WD-CAP-BLK-OS',   10),
  ('var_manifesto_posters_os',  'prod_manifesto_posters', 'ONE_SIZE', 'WD-PRT-MAN-OS',   10),
  ('var_blade_chain_vault_os',  'prod_blade_chain_vault', 'ONE_SIZE', 'WD-CHN-VLT-OS',   10),
  ('var_studio_zine_01_os',     'prod_studio_zine_01',    'ONE_SIZE', 'WD-ZIN-001-OS',   10)

on conflict (id) do update set
  size     = excluded.size,
  sku      = excluded.sku,
  position = excluded.position;
