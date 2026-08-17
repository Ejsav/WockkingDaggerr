-- ============================================================
-- 0002 — COMMERCE
--
-- The inventory model has three numbers per variant:
--   inventory_count  physical units on hand
--   reserved_count   units held by an open checkout session
--   available        inventory_count - reserved_count  (derived)
--
-- Reservation happens when a Stripe Checkout Session is created
-- and is committed or released by webhook. That is what makes
-- the last unit safe: two shoppers cannot both reserve it,
-- because the reserving UPDATE takes a row lock and its WHERE
-- clause re-checks availability inside the transaction.
--
-- Idempotency is enforced by stripe_events: every webhook body
-- is keyed by Stripe's event id and inserted before any effect,
-- so a replayed delivery is a no-op.
-- ============================================================

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table if not exists public.products (
    id              text primary key,
    slug            text not null unique,
    name            text not null,
    tagline         text,
    description     text not null default '',
    price_cents     integer not null check (price_cents >= 0),
    currency        text not null default 'USD',
    stripe_price_id text,
    image_urls      text[] not null default '{}',
    category        text not null,
    active          boolean not null default true,
    position        integer not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists products_active_idx   on public.products (active, position);
create index if not exists products_category_idx on public.products (category);

-- ------------------------------------------------------------
-- VARIANTS — the unit inventory is actually tracked against.
-- Non-apparel products get a single ONE_SIZE variant so that the
-- whole pipeline (cart, checkout, webhook, order) has exactly one
-- shape to handle.
-- ------------------------------------------------------------
create table if not exists public.product_variants (
    id              text primary key,
    product_id      text not null references public.products (id) on delete cascade,
    size            text not null,
    sku             text not null unique,
    inventory_count integer not null default 0 check (inventory_count >= 0),
    reserved_count  integer not null default 0 check (reserved_count  >= 0),
    position        integer not null default 0,
    updated_at      timestamptz not null default now(),
    unique (product_id, size),
    constraint variants_not_oversold check (reserved_count <= inventory_count)
);

create index if not exists variants_product_idx on public.product_variants (product_id, position);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table if not exists public.orders (
    id                       uuid primary key default gen_random_uuid(),
    stripe_session_id        text not null unique,
    stripe_payment_intent_id text,
    email                    text,
    shipping_name            text,
    total_cents              integer not null check (total_cents >= 0),
    currency                 text not null default 'USD',
    status                   text not null default 'paid'
                             check (status in ('paid','fulfilled','refunded')),
    line_items               jsonb not null default '[]'::jsonb,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

-- ------------------------------------------------------------
-- RESERVATIONS — one row per line of an open checkout session
-- ------------------------------------------------------------
create table if not exists public.inventory_reservations (
    id                uuid primary key default gen_random_uuid(),
    -- Our own reference, minted before Stripe is called, so stock is held
    -- before a session exists and can be released if session creation fails.
    checkout_ref      text not null,
    stripe_session_id text,
    variant_id        text not null references public.product_variants (id) on delete cascade,
    quantity          integer not null check (quantity > 0),
    state             text not null default 'held'
                      check (state in ('held','committed','released')),
    expires_at        timestamptz not null,
    created_at        timestamptz not null default now()
);

create index if not exists reservations_ref_idx on public.inventory_reservations (checkout_ref);
create index if not exists reservations_sweep_idx
    on public.inventory_reservations (state, expires_at)
    where state = 'held';

-- ------------------------------------------------------------
-- STRIPE EVENT LEDGER — the idempotency key
-- ------------------------------------------------------------
create table if not exists public.stripe_events (
    id           text primary key,   -- Stripe's evt_… id
    type         text not null,
    processed_at timestamptz not null default now()
);

-- ============================================================
-- FUNCTIONS
-- All are SECURITY DEFINER with a pinned search_path and are
-- revoked from anon/authenticated: only the service role, called
-- from server routes, may execute them.
-- ============================================================

-- ------------------------------------------------------------
-- reserve_inventory — hold stock for a checkout session.
-- Raises if any line cannot be satisfied, which rolls back every
-- hold taken so far. Callers surface that as "no longer available".
-- ------------------------------------------------------------
create or replace function public.reserve_inventory(
    p_checkout_ref text,
    p_items      jsonb,          -- [{"variant_id":"…","quantity":1}, …]
    p_ttl_minutes integer default 35
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item        jsonb;
  v_variant   text;
  v_quantity  integer;
  v_updated   integer;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_variant  := item ->> 'variant_id';
    v_quantity := (item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY:%', v_variant;
    end if;

    -- Row lock + availability re-check in one statement. Two concurrent
    -- callers serialize here; the loser sees 0 rows updated.
    update product_variants
       set reserved_count = reserved_count + v_quantity,
           updated_at     = now()
     where id = v_variant
       and inventory_count - reserved_count >= v_quantity;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'INSUFFICIENT_STOCK:%', v_variant;
    end if;

    insert into inventory_reservations (checkout_ref, variant_id, quantity, expires_at)
    values (p_checkout_ref, v_variant, v_quantity, now() + make_interval(mins => p_ttl_minutes));
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- release_reservation — hand stock back (session expired/cancelled).
-- Idempotent: only rows still in 'held' are acted on.
-- ------------------------------------------------------------
create or replace function public.release_reservation(p_checkout_ref text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer := 0;
  r        record;
begin
  for r in
    select id, variant_id, quantity
      from inventory_reservations
     where checkout_ref = p_checkout_ref and state = 'held'
     for update
  loop
    update product_variants
       set reserved_count = greatest(0, reserved_count - r.quantity),
           updated_at     = now()
     where id = r.variant_id;

    update inventory_reservations set state = 'released' where id = r.id;
    released := released + 1;
  end loop;

  return released;
end;
$$;

-- ------------------------------------------------------------
-- commit_purchase — the only path that creates an order.
-- Atomic across: event ledger, order row, inventory decrement,
-- reservation state. Replaying the same Stripe event is a no-op
-- and returns the order that already exists.
-- ------------------------------------------------------------
create or replace function public.commit_purchase(
    p_event_id          text,
    p_event_type        text,
    p_checkout_ref      text,
    p_session_id        text,
    p_payment_intent_id text,
    p_email             text,
    p_shipping_name     text,
    p_total_cents       integer,
    p_currency          text,
    p_line_items        jsonb   -- [{product_id,variant_id,slug,name,size,quantity,unit_price_cents}, …]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  r          record;
  item       jsonb;
  v_variant  text;
  v_quantity integer;
begin
  -- Idempotency gate. A duplicate delivery stops here.
  insert into stripe_events (id, type) values (p_event_id, p_event_type)
  on conflict (id) do nothing;

  if not found then
    select id into v_order_id from orders where stripe_session_id = p_session_id;
    return v_order_id;
  end if;

  -- A second event type for the same session (e.g. async payment
  -- succeeded after completion) must not create a second order.
  select id into v_order_id from orders where stripe_session_id = p_session_id;
  if v_order_id is not null then
    return v_order_id;
  end if;

  insert into orders (
    stripe_session_id, stripe_payment_intent_id, email, shipping_name,
    total_cents, currency, status, line_items
  )
  values (
    p_session_id, p_payment_intent_id, p_email, p_shipping_name,
    p_total_cents, coalesce(p_currency, 'USD'), 'paid', p_line_items
  )
  returning id into v_order_id;

  -- Convert holds into a real decrement.
  for r in
    select id, variant_id, quantity
      from inventory_reservations
     where checkout_ref = p_checkout_ref and state = 'held'
     for update
  loop
    update product_variants
       set inventory_count = greatest(0, inventory_count - r.quantity),
           reserved_count  = greatest(0, reserved_count  - r.quantity),
           updated_at      = now()
     where id = r.variant_id;

    update inventory_reservations
       set state = 'committed', stripe_session_id = p_session_id
     where id = r.id;
  end loop;

  -- Defensive path: a paid session with no surviving hold (its
  -- reservation was swept) still decrements, so stock never
  -- overstates what is on the shelf.
  if not exists (
    select 1 from inventory_reservations
     where checkout_ref = p_checkout_ref and state = 'committed'
  ) then
    for item in select * from jsonb_array_elements(p_line_items)
    loop
      v_variant  := item ->> 'variant_id';
      v_quantity := (item ->> 'quantity')::integer;
      update product_variants
         set inventory_count = greatest(0, inventory_count - v_quantity),
             updated_at      = now()
       where id = v_variant;
    end loop;
  end if;

  return v_order_id;
end;
$$;

-- ------------------------------------------------------------
-- sweep_expired_reservations — safety net for holds whose session
-- never produced a webhook. Called on every cron sync.
-- ------------------------------------------------------------
create or replace function public.sweep_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  swept integer := 0;
  r     record;
begin
  for r in
    select id, variant_id, quantity
      from inventory_reservations
     where state = 'held' and expires_at < now()
     for update skip locked
  loop
    update product_variants
       set reserved_count = greatest(0, reserved_count - r.quantity),
           updated_at     = now()
     where id = r.variant_id;

    update inventory_reservations set state = 'released' where id = r.id;
    swept := swept + 1;
  end loop;

  return swept;
end;
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.products               enable row level security;
alter table public.product_variants       enable row level security;
alter table public.orders                 enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.stripe_events          enable row level security;

drop policy if exists "products: anon reads active" on public.products;
create policy "products: anon reads active"
  on public.products for select to anon, authenticated
  using (active = true);

-- Variants of active products are readable so the storefront can render
-- real availability. reserved_count is not sensitive: it is derived from
-- public purchasing activity.
drop policy if exists "variants: anon reads active product variants" on public.product_variants;
create policy "variants: anon reads active product variants"
  on public.product_variants for select to anon, authenticated
  using (exists (select 1 from products p where p.id = product_id and p.active));

-- orders, inventory_reservations and stripe_events have RLS on and no
-- policies: unreachable with the anon key under any query.

-- Functions are service-role only.
revoke all on function public.reserve_inventory(text, jsonb, integer)  from public, anon, authenticated;
revoke all on function public.release_reservation(text)                from public, anon, authenticated;
revoke all on function public.commit_purchase(text, text, text, text, text, text, text, integer, text, jsonb)
                                                                       from public, anon, authenticated;
revoke all on function public.sweep_expired_reservations()             from public, anon, authenticated;

drop trigger if exists products_set_updated on public.products;
create trigger products_set_updated before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated on public.orders;
create trigger orders_set_updated before update on public.orders
  for each row execute function public.set_updated_at();
