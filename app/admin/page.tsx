import type { Metadata } from "next";
import {
  getAdminDrops,
  getAdminMedia,
  getAdminProducts,
  getAdminStats,
  getRecentOrders,
  getRecentSyncRuns,
} from "@/lib/data/admin";
import { formatDate, formatPrice, formatRelativeDate, formatSize } from "@/lib/utils";
import { computeDropStatus } from "@/types";
import AdminTabs from "@/components/admin/AdminTabs";
import InventoryEditor from "@/components/admin/InventoryEditor";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import DropEditor from "@/components/admin/DropEditor";
import SyncPanel from "@/components/admin/SyncPanel";
import SignOutButton from "@/components/admin/SignOutButton";

// ============================================================
// CONTROL ROOM
//
// Reached only through middleware, which verifies the signed
// session cookie before this file is ever executed.
//
// Every figure below is a live count and every control performs
// a real, persisted mutation. There are no illustrative numbers
// and no buttons that do nothing.
// ============================================================

export const metadata: Metadata = {
  title: "Control room",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, products, drops, media, orders, runs] = await Promise.all([
    getAdminStats(),
    getAdminProducts(),
    getAdminDrops(),
    getAdminMedia(60),
    getRecentOrders(15),
    getRecentSyncRuns(12),
  ]);

  if (!stats) {
    return (
      <section className="mx-auto max-w-shell px-gutter py-section">
        <h1 className="display text-section">Storage not configured</h1>
        <p className="prose-body mt-5">
          The control room needs a database. Set{" "}
          <code className="font-mono text-xs text-primary">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-xs text-primary">SUPABASE_SERVICE_ROLE_KEY</code>, run the
          migrations in <code className="font-mono text-xs text-primary">supabase/migrations</code>,
          then reload.
        </p>
      </section>
    );
  }

  const tiles = [
    { label: "Products live", value: String(stats.products_active) },
    { label: "Units in stock", value: stats.units_in_stock.toLocaleString("en-US") },
    { label: "Units held", value: stats.units_held.toLocaleString("en-US") },
    { label: "Archive items", value: stats.archive_items.toLocaleString("en-US") },
    { label: "Drops published", value: String(stats.drops_published) },
    { label: "Subscribers", value: stats.subscribers.toLocaleString("en-US") },
    { label: "Paid orders", value: String(stats.orders_paid) },
    { label: "Revenue", value: formatPrice(stats.revenue_cents) },
  ];

  return (
    <div className="mx-auto max-w-shell px-gutter pb-section pt-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow-accent mb-3">Control room</p>
          <h1 className="display text-[clamp(2rem,5vw,3.5rem)]">Command.</h1>
        </div>
        <SignOutButton />
      </header>

      <AdminTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {tiles.map((t) => (
                    <div key={t.label} className="border border-faint bg-surface-1 p-5">
                      <p className="eyebrow mb-3">{t.label}</p>
                      <p className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none tabular-nums">
                        {t.value}
                      </p>
                    </div>
                  ))}
                </div>

                {stats.units_in_stock === 0 && (
                  <p className="mt-6 border border-[var(--blade)]/50 bg-blade/10 p-4 font-mono text-[11px] uppercase tracking-button text-blade-text">
                    Every variant is at zero, so the whole store reads as sold out. Set real counts
                    under Inventory to open it.
                  </p>
                )}

                <h2 className="eyebrow mt-12 mb-4">Recent orders</h2>
                {orders.length > 0 ? (
                  <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
                    {orders.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
                        <span className="font-mono text-xs uppercase tracking-button text-tertiary">
                          {formatRelativeDate(o.created_at)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {o.email ?? "no email"} ·{" "}
                          {o.line_items
                            .map((l) => `${l.name} (${formatSize(l.size)}) ×${l.quantity}`)
                            .join(", ") || "—"}
                        </span>
                        <span className="font-mono text-sm tabular-nums">
                          {formatPrice(o.total_cents, o.currency)}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-button text-tertiary">
                          {o.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="meta">No orders yet.</p>
                )}
              </>
            ),
          },
          {
            id: "inventory",
            label: "Inventory",
            content: <InventoryEditor products={products} />,
          },
          {
            id: "products",
            label: "Products",
            content: (
              <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
                {products.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-card uppercase tracking-display">
                        {p.name}
                      </span>
                      <span className="meta">
                        {p.category} · {formatPrice(p.price_cents, p.currency)} ·{" "}
                        {p.variants.reduce((s, v) => s + v.inventory_count, 0)} units
                      </span>
                    </span>
                    <ToggleSwitch
                      endpoint="/api/admin/product"
                      payloadKey="product_id"
                      id={p.id}
                      field="active"
                      initial={p.active}
                      onLabel="Live"
                      offLabel="Hidden"
                    />
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: "drops",
            label: "Drops",
            content: <DropEditor drops={drops} products={products} />,
          },
          {
            id: "archive",
            label: "Archive",
            content:
              media.length > 0 ? (
                <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
                  {media.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-4 py-3">
                      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-button text-tertiary">
                        {m.source}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{m.title}</span>
                        <span className="meta">
                          {m.published_at ? formatDate(m.published_at) : "no date"}
                        </span>
                      </span>
                      <ToggleSwitch
                        endpoint="/api/admin/media"
                        payloadKey="media_id"
                        id={m.id}
                        field="visible"
                        initial={m.visible}
                        onLabel="Visible"
                        offLabel="Hidden"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="meta">
                  Nothing synced yet. Run a sync from the Sync tab, or wait for the cron schedule.
                </p>
              ),
          },
          {
            id: "sync",
            label: "Sync",
            content: (
              <SyncPanel
                runs={runs.map((r) => ({
                  id: r.id,
                  source: r.source,
                  ok: r.ok,
                  items: r.items,
                  duration_ms: r.duration_ms,
                  error: r.error,
                  ran_at: r.ran_at,
                }))}
              />
            ),
          },
        ]}
      />

      <p className="mt-12 border-t border-faint pt-6 meta">
        Drop status is derived from the clock:{" "}
        {drops.length > 0
          ? drops
              .slice(0, 3)
              .map((d) => `${d.name} — ${computeDropStatus(d)}`)
              .join(" · ")
          : "no drops created"}
      </p>
    </div>
  );
}
