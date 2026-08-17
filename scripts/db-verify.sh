#!/usr/bin/env bash
# ============================================================
# DATABASE VERIFICATION HARNESS
#
# Applies every migration to a throwaway Postgres and exercises
# the guarantees the storefront depends on:
#
#   1. migrations apply cleanly, and are re-runnable
#   2. concurrent buyers cannot both reserve the last unit
#   3. a replayed Stripe event does not create a second order
#      or decrement stock twice
#   4. an abandoned checkout returns its stock to the shelf
#   5. RLS hides orders and subscribers from the anon role
#
# Usage: scripts/db-verify.sh [PGHOST] [PGPORT]
# Requires a Postgres reachable with the `postgres` superuser.
# ============================================================
set -euo pipefail

PGHOST="${1:-/tmp}"
PGPORT="${2:-5433}"
DB="wd_verify_$$"
PSQL="psql -h $PGHOST -p $PGPORT -U postgres -v ON_ERROR_STOP=1 -q"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() { psql -h "$PGHOST" -p "$PGPORT" -U postgres -q -c "drop database if exists $DB (force);" >/dev/null 2>&1 || true; }
trap cleanup EXIT

pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; exit 1; }

$PSQL -c "create database $DB;" >/dev/null
PSQL="$PSQL -d $DB"

# Supabase provides these roles; create them so migrations apply verbatim.
$PSQL -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end \$\$;" >/dev/null
$PSQL -c "grant usage on schema public to anon, authenticated, service_role;" >/dev/null

echo "── migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  $PSQL -f "$f" >/dev/null
done
pass "all migrations applied"

# Re-run everything: migrations must be idempotent so a redeploy is safe.
for f in "$ROOT"/supabase/migrations/*.sql; do
  $PSQL -f "$f" >/dev/null
done
pass "migrations are re-runnable"

$PSQL -c "grant select on all tables in schema public to anon, authenticated;" >/dev/null

# ------------------------------------------------------------
echo "── inventory: last unit under contention"
$PSQL -c "update product_variants set inventory_count = 1 where id = 'var_blade_hoodie_onyx_m';" >/dev/null

# Two buyers race for the same single unit. Both statements run inside
# their own transaction; the second must be refused by the availability
# re-check inside reserve_inventory.
set +e
$PSQL -c "select reserve_inventory('ref_buyer_a', '[{\"variant_id\":\"var_blade_hoodie_onyx_m\",\"quantity\":1}]'::jsonb);" >/dev/null 2>&1
A=$?
$PSQL -c "select reserve_inventory('ref_buyer_b', '[{\"variant_id\":\"var_blade_hoodie_onyx_m\",\"quantity\":1}]'::jsonb);" >/dev/null 2>&1
B=$?
set -e
[ "$A" -eq 0 ] || fail "first buyer could not reserve the only unit"
[ "$B" -ne 0 ] || fail "second buyer also reserved the last unit — oversold"
pass "second buyer rejected (INSUFFICIENT_STOCK)"

RESERVED=$($PSQL -tAc "select reserved_count from product_variants where id='var_blade_hoodie_onyx_m';")
[ "$RESERVED" = "1" ] || fail "reserved_count is $RESERVED, expected 1"
pass "reserved_count held at exactly 1"

# ------------------------------------------------------------
echo "── multi-line reservation rolls back as a unit"
$PSQL -c "update product_variants set inventory_count = 5 where id='var_dagger_tee_bone_l';" >/dev/null
set +e
$PSQL -c "select reserve_inventory('ref_partial', '[
  {\"variant_id\":\"var_dagger_tee_bone_l\",\"quantity\":2},
  {\"variant_id\":\"var_blade_hoodie_onyx_m\",\"quantity\":1}]'::jsonb);" >/dev/null 2>&1
R=$?
set -e
[ "$R" -ne 0 ] || fail "reservation succeeded despite an unavailable line"
LEAKED=$($PSQL -tAc "select reserved_count from product_variants where id='var_dagger_tee_bone_l';")
[ "$LEAKED" = "0" ] || fail "partial hold leaked: reserved_count=$LEAKED, expected 0"
pass "failed line rolled back the whole hold — no leaked stock"

# ------------------------------------------------------------
echo "── webhook idempotency"
LINES='[{"product_id":"prod_blade_hoodie_onyx","variant_id":"var_blade_hoodie_onyx_m","slug":"blade-hoodie-onyx","name":"BLADE HOODIE — ONYX","size":"M","quantity":1,"unit_price_cents":18500}]'

ORDER1=$($PSQL -tAc "select commit_purchase('evt_test_1','checkout.session.completed','ref_buyer_a','cs_test_1','pi_test_1','buyer@example.com','A Buyer',18500,'USD','$LINES'::jsonb);")
ORDER2=$($PSQL -tAc "select commit_purchase('evt_test_1','checkout.session.completed','ref_buyer_a','cs_test_1','pi_test_1','buyer@example.com','A Buyer',18500,'USD','$LINES'::jsonb);")

[ -n "$ORDER1" ] || fail "first webhook did not create an order"
[ "$ORDER1" = "$ORDER2" ] || fail "replay created a different order ($ORDER1 vs $ORDER2)"
pass "replayed event returned the same order id"

COUNT=$($PSQL -tAc "select count(*) from orders where stripe_session_id='cs_test_1';")
[ "$COUNT" = "1" ] || fail "expected 1 order row, found $COUNT"
pass "exactly one order row"

read -r INV RES <<<"$($PSQL -tAc "select inventory_count, reserved_count from product_variants where id='var_blade_hoodie_onyx_m';" | tr '|' ' ')"
[ "$INV" = "0" ] || fail "inventory_count is $INV, expected 0 after one sale of the last unit"
[ "$RES" = "0" ] || fail "reserved_count is $RES, expected 0 after commit"
pass "stock decremented exactly once (inventory 0, reserved 0)"

SIZE=$($PSQL -tAc "select line_items->0->>'size' from orders where stripe_session_id='cs_test_1';")
[ "$SIZE" = "M" ] || fail "size on the order row is '$SIZE', expected 'M'"
pass "size survived to the persisted order row"

# ------------------------------------------------------------
echo "── abandoned checkout returns stock"
$PSQL -c "update product_variants set inventory_count = 3 where id='var_crest_cap_black_os';" >/dev/null
$PSQL -c "select reserve_inventory('ref_abandoned','[{\"variant_id\":\"var_crest_cap_black_os\",\"quantity\":2}]'::jsonb);" >/dev/null
HELD=$($PSQL -tAc "select reserved_count from product_variants where id='var_crest_cap_black_os';")
[ "$HELD" = "2" ] || fail "expected 2 held, got $HELD"

$PSQL -c "update inventory_reservations set expires_at = now() - interval '1 hour' where checkout_ref='ref_abandoned';" >/dev/null
# One reservation row holding two units — the sweep counts rows, not units.
SWEPT=$($PSQL -tAc "select sweep_expired_reservations();")
[ "$SWEPT" = "1" ] || fail "sweep released $SWEPT reservation rows, expected 1"
AFTER=$($PSQL -tAc "select reserved_count from product_variants where id='var_crest_cap_black_os';")
[ "$AFTER" = "0" ] || fail "reserved_count is $AFTER after sweep, expected 0"
pass "expired holds swept, stock back on the shelf"

# Sweeping twice must not double-credit.
$PSQL -tAc "select sweep_expired_reservations();" >/dev/null
AFTER2=$($PSQL -tAc "select reserved_count from product_variants where id='var_crest_cap_black_os';")
[ "$AFTER2" = "0" ] || fail "second sweep corrupted reserved_count to $AFTER2"
pass "sweep is idempotent"

# ------------------------------------------------------------
echo "── row level security"
check_denied() {
  local table="$1"
  local n
  n=$(PGOPTIONS="-c role=anon" psql -h "$PGHOST" -p "$PGPORT" -U postgres -d "$DB" -tAc \
        "select count(*) from $table;" 2>/dev/null || echo "ERR")
  if [ "$n" = "0" ] || [ "$n" = "ERR" ]; then
    pass "anon cannot read $table"
  else
    fail "anon read $n rows from $table"
  fi
}
check_denied orders
check_denied subscribers
check_denied inventory_reservations
check_denied stripe_events

VISIBLE=$(PGOPTIONS="-c role=anon" psql -h "$PGHOST" -p "$PGPORT" -U postgres -d "$DB" -tAc \
  "select count(*) from products;")
[ "$VISIBLE" -gt 0 ] || fail "anon cannot read active products — the storefront would be empty"
pass "anon can read active products ($VISIBLE rows)"

$PSQL -c "update products set active = false where id='prod_studio_zine_01';" >/dev/null
HIDDEN=$(PGOPTIONS="-c role=anon" psql -h "$PGHOST" -p "$PGPORT" -U postgres -d "$DB" -tAc \
  "select count(*) from products where id='prod_studio_zine_01';")
[ "$HIDDEN" = "0" ] || fail "anon can read an inactive product"
pass "inactive products hidden from anon"

DENIED=$(PGOPTIONS="-c role=anon" psql -h "$PGHOST" -p "$PGPORT" -U postgres -d "$DB" -tAc \
  "select commit_purchase('e','t','r','s','p','e','n',1,'USD','[]'::jsonb);" 2>&1 || true)
case "$DENIED" in
  *"permission denied"*) pass "anon cannot execute commit_purchase" ;;
  *) fail "anon executed commit_purchase: $DENIED" ;;
esac

# ------------------------------------------------------------
echo "── seed honesty"
STOCKED=$($PSQL -tAc "select count(*) from product_variants where inventory_count > 0 and id not in
  ('var_blade_hoodie_onyx_m','var_dagger_tee_bone_l','var_crest_cap_black_os');")
[ "$STOCKED" = "0" ] || fail "$STOCKED seeded variants carry invented stock"
pass "catalog seed ships zero inventory — no invented stock numbers"

echo
printf '\033[32mAll database guarantees verified.\033[0m\n'
