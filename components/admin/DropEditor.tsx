"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { computeDropStatus, type Drop } from "@/types";
import type { AdminProduct } from "@/lib/data/admin";

// ============================================================
// DROPS
//
// Create, edit, publish and delete. This is the only way a drop
// gets onto the site — nothing is seeded — so the drop calendar
// only ever shows dates a human actually entered.
// ============================================================

interface FormState {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  hero_image_url: string;
  drops_at: string;
  ends_at: string;
  product_ids: string[];
  published: boolean;
}

const EMPTY: FormState = {
  id: null,
  slug: "",
  name: "",
  description: "",
  hero_image_url: "",
  drops_at: "",
  ends_at: "",
  product_ids: [],
  published: false,
};

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function DropEditor({
  drops,
  products,
}: {
  drops: Drop[];
  products: AdminProduct[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(drop: Drop) {
    setError(null);
    setForm({
      id: drop.id,
      slug: drop.slug,
      name: drop.name,
      description: drop.description,
      hero_image_url: drop.hero_image_url ?? "",
      drops_at: toLocalInput(drop.drops_at),
      ends_at: toLocalInput(drop.ends_at),
      product_ids: drop.product_ids,
      published: drop.published,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || busy) return;

    const dropsAt = toIso(form.drops_at);
    if (!dropsAt) {
      setError("Set a valid opening date and time.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: form.id ? "update" : "create",
          ...(form.id ? { id: form.id } : {}),
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          hero_image_url: form.hero_image_url.trim(),
          drops_at: dropsAt,
          ends_at: toIso(form.ends_at) ?? "",
          product_ids: form.product_ids,
          published: form.published,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not save the drop.");
        return;
      }
      setForm(null);
      router.refresh();
    } catch {
      setError("Network problem.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await fetch("/api/admin/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {!form && (
        <button type="button" onClick={() => setForm(EMPTY)} className="btn btn-primary">
          <span>New drop</span>
        </button>
      )}

      {form && (
        <form onSubmit={submit} className="space-y-6 border border-faint bg-surface-1 p-6">
          <h3 className="eyebrow-accent">{form.id ? "Edit drop" : "New drop"}</h3>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" required>
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field"
              />
            </Field>

            <Field label="Slug" hint="lowercase-with-hyphens" required>
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={60}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="field"
              />
            </Field>

            <Field label="Opens" required>
              <input
                required
                type="datetime-local"
                value={form.drops_at}
                onChange={(e) => setForm({ ...form, drops_at: e.target.value })}
                className="field"
              />
            </Field>

            <Field label="Closes" hint="optional">
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="field"
              />
            </Field>

            <Field label="Hero image path" hint="optional, e.g. /product/hero.svg">
              <input
                maxLength={500}
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                className="field"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="field resize-y"
            />
          </Field>

          <fieldset>
            <legend className="eyebrow mb-3">Products in this drop</legend>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => {
                const selected = form.product_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setForm({
                        ...form,
                        product_ids: selected
                          ? form.product_ids.filter((id) => id !== p.id)
                          : [...form.product_ids, p.id],
                      })
                    }
                    className={`min-h-11 border px-3 font-mono text-[10px] uppercase tracking-button transition-colors duration-base ease-out ${
                      selected
                        ? "border-[var(--blade)] bg-blade text-bone"
                        : "border-[var(--line-strong)] text-tertiary hover:border-bone hover:text-primary"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-5 w-5 accent-[var(--blade)]"
            />
            <span className="font-mono text-[11px] uppercase tracking-button">
              Publish to the site
            </span>
          </label>

          {error && (
            <p role="alert" className="font-mono text-[11px] uppercase tracking-button text-blade-text">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              <span>{busy ? "Saving…" : form.id ? "Save changes" : "Create drop"}</span>
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn btn-secondary">
              <span>Cancel</span>
            </button>
          </div>
        </form>
      )}

      {drops.length > 0 ? (
        <ul className="divide-y divide-[var(--line-faint)] border-y border-faint">
          {drops.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-4 py-4">
              <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-button text-tertiary">
                {computeDropStatus(d)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-card uppercase tracking-display">
                  {d.name}
                </span>
                <span className="meta">
                  {formatDate(d.drops_at)}
                  {d.ends_at && ` — ${formatDate(d.ends_at)}`} · {d.product_ids.length} pieces ·{" "}
                  {d.published ? "published" : "draft"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => edit(d)}
                className="link-draw font-mono text-[11px] uppercase tracking-button"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(d.id, d.name)}
                className="link-draw font-mono text-[11px] uppercase tracking-button text-blade-text"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">
          No drops yet. The drop calendar shows an honest empty state until one is created here.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">
        {label}
        {required && <span className="text-blade-text"> *</span>}
        {hint && <span className="normal-case tracking-normal text-tertiary"> — {hint}</span>}
      </span>
      {children}
    </label>
  );
}
