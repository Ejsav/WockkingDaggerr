-- ============================================================
-- WOCKKINGDAGGER HUB — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor to create the full schema.
-- ============================================================

-- ------------------------------------------------------------
-- POSTS  (auto-organized social content)
-- ------------------------------------------------------------
create table if not exists public.posts (
    id text primary key,
    platform text not null check (platform in ('youtube', 'tiktok', 'instagram')),
    external_id text not null,
    title text not null,
    description text,
    thumbnail_url text,
    embed_url text,
    permalink text,
    posted_at timestamptz not null default now(),
    duration_seconds integer,
    view_count bigint,
    visible boolean not null default true,
    tags text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists posts_platform_idx on public.posts (platform);
create index if not exists posts_posted_at_idx on public.posts (posted_at desc);
create index if not exists posts_visible_idx on public.posts (visible);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table if not exists public.products (
    id text primary key,
    slug text not null unique,
    name text not null,
    tagline text,
    description text not null,
    price_cents integer not null,
    currency text not null default 'USD',
    stripe_price_id text,
    inventory_count integer,
    image_urls text[] not null default '{}',
    category text not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active);
create index if not exists products_category_idx on public.products (category);

-- ------------------------------------------------------------
-- DROPS
-- ------------------------------------------------------------
create table if not exists public.drops (
    id text primary key,
    slug text not null unique,
    name text not null,
    description text not null,
    hero_image_url text,
    drops_at timestamptz not null,
    ends_at timestamptz,
    status text not null check (status in ('upcoming', 'live', 'ended')),
    product_ids text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists drops_status_idx on public.drops (status);
create index if not exists drops_drops_at_idx on public.drops (drops_at desc);

-- ------------------------------------------------------------
-- SUBSCRIBERS  (email / SMS capture)
-- ------------------------------------------------------------
create table if not exists public.subscribers (
    id uuid primary key default gen_random_uuid(),
    email text,
    phone text,
    source text not null default 'site',
    sms_consent boolean not null default false,
    email_consent boolean not null default true,
    created_at timestamptz not null default now(),
    unique (email),
    unique (phone)
);

create index if not exists subscribers_created_idx on public.subscribers (created_at desc);

-- ------------------------------------------------------------
-- ORDERS  (Stripe sessions persisted via webhook)
-- ------------------------------------------------------------
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    stripe_session_id text not null unique,
    email text,
    total_cents integer not null,
    currency text not null default 'USD',
    status text not null check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'failed')),
    line_items jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public anon key reads only visible/active rows.
-- Writes happen through service-role key from server routes.
-- ============================================================
alter table public.posts enable row level security;
alter table public.products enable row level security;
alter table public.drops enable row level security;
alter table public.subscribers enable row level security;
alter table public.orders enable row level security;

-- PUBLIC READS
create policy "Posts: anon can read visible"
  on public.posts for select
  using (visible = true);

create policy "Products: anon can read active"
  on public.products for select
  using (active = true);

create policy "Drops: anon can read all"
  on public.drops for select
  using (true);

-- NO PUBLIC READS on subscribers or orders.
-- Service role bypasses RLS entirely for sync routes + webhooks.

-- ------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_set_updated on public.posts;
create trigger posts_set_updated before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated on public.products;
create trigger products_set_updated before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists drops_set_updated on public.drops;
create trigger drops_set_updated before update on public.drops
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated on public.orders;
create trigger orders_set_updated before update on public.orders
  for each row execute function public.set_updated_at();
