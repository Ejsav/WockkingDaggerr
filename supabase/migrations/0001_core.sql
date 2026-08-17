-- ============================================================
-- 0001 — CORE CONTENT
--
-- Postgres is the durable source of truth for everything the
-- site renders. Nothing important lives in process memory.
--
-- RLS intent, per table:
--   media_items  public reads of visible rows only
--   drops        public reads of published rows only
--   sync_runs    no public access — operator telemetry
--   live_status  public reads (single row, written by cron)
-- Writes are performed exclusively by the service-role key from
-- server routes, which bypasses RLS.
-- ============================================================

-- ------------------------------------------------------------
-- MEDIA — YouTube uploads, Twitch VODs, TikTok, Instagram
-- ------------------------------------------------------------
create table if not exists public.media_items (
    id               text primary key,               -- "youtube:VIDEO_ID"
    source           text not null check (source in ('youtube','twitch','tiktok','instagram')),
    kind             text not null check (kind in ('video','vod','short','post')),
    external_id      text not null,
    title            text not null,
    description      text,
    thumbnail_url    text,
    permalink        text not null,
    embed_url        text,
    published_at     timestamptz,
    duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
    view_count       bigint  check (view_count is null or view_count >= 0),
    visible          boolean not null default true,
    synced_at        timestamptz not null default now(),
    created_at       timestamptz not null default now()
);

create index if not exists media_items_visible_published_idx
    on public.media_items (visible, published_at desc nulls last);
create index if not exists media_items_source_idx on public.media_items (source);
create unique index if not exists media_items_source_external_idx
    on public.media_items (source, external_id);

-- ------------------------------------------------------------
-- DROPS — scheduled releases
-- `status` is deliberately absent: it is derived from the clock
-- at read time so a drop can never sit in a stale state because
-- a cron job did not fire.
-- ------------------------------------------------------------
create table if not exists public.drops (
    id             uuid primary key default gen_random_uuid(),
    slug           text not null unique,
    name           text not null,
    description    text not null default '',
    hero_image_url text,
    drops_at       timestamptz not null,
    ends_at        timestamptz,
    product_ids    text[] not null default '{}',
    published      boolean not null default false,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    constraint drops_window_valid check (ends_at is null or ends_at > drops_at)
);

create index if not exists drops_published_idx on public.drops (published, drops_at desc);

-- ------------------------------------------------------------
-- LIVE STATUS — single row, refreshed by cron
-- Kept out of the request path so a Twitch outage cannot slow
-- or break page rendering.
-- ------------------------------------------------------------
create table if not exists public.live_status (
    id           boolean primary key default true check (id),
    is_live      boolean not null default false,
    platform     text    not null default 'twitch',
    channel      text    not null default '',
    title        text,
    game         text,
    viewer_count integer check (viewer_count is null or viewer_count >= 0),
    started_at   timestamptz,
    checked_at   timestamptz not null default now()
);

insert into public.live_status (id) values (true) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- SUBSCRIBERS — email / SMS capture
-- ------------------------------------------------------------
create table if not exists public.subscribers (
    id            uuid primary key default gen_random_uuid(),
    email         text unique,
    phone         text unique,
    source        text not null default 'site',
    sms_consent   boolean not null default false,
    email_consent boolean not null default true,
    created_at    timestamptz not null default now(),
    constraint subscribers_contact_present check (email is not null or phone is not null)
);

create index if not exists subscribers_created_idx on public.subscribers (created_at desc);

-- ------------------------------------------------------------
-- SYNC RUNS — every cron execution leaves a trace
-- ------------------------------------------------------------
create table if not exists public.sync_runs (
    id          uuid primary key default gen_random_uuid(),
    source      text not null,
    ok          boolean not null,
    items       integer not null default 0,
    duration_ms integer not null default 0,
    error       text,
    ran_at      timestamptz not null default now()
);

create index if not exists sync_runs_source_ran_idx on public.sync_runs (source, ran_at desc);

-- ------------------------------------------------------------
-- UPDATED_AT
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drops_set_updated on public.drops;
create trigger drops_set_updated before update on public.drops
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.media_items enable row level security;
alter table public.drops       enable row level security;
alter table public.live_status enable row level security;
alter table public.subscribers enable row level security;
alter table public.sync_runs   enable row level security;

drop policy if exists "media_items: anon reads visible" on public.media_items;
create policy "media_items: anon reads visible"
  on public.media_items for select to anon, authenticated
  using (visible = true);

drop policy if exists "drops: anon reads published" on public.drops;
create policy "drops: anon reads published"
  on public.drops for select to anon, authenticated
  using (published = true);

drop policy if exists "live_status: anon reads" on public.live_status;
create policy "live_status: anon reads"
  on public.live_status for select to anon, authenticated
  using (true);

-- subscribers and sync_runs intentionally have RLS enabled and no
-- policies: the anon key can neither read nor write them. All access
-- is service-role only.
