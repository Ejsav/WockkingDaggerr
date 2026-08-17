"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// A real switch: it posts, and it reverts visibly if the post fails.
// Optimistic UI that silently diverges from the database is exactly the
// kind of control that looks like it works and does not.
export default function ToggleSwitch({
  endpoint,
  payloadKey,
  id,
  field,
  initial,
  onLabel,
  offLabel,
}: {
  endpoint: string;
  payloadKey: string;
  id: string;
  field: string;
  initial: boolean;
  onLabel: string;
  offLabel: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setBusy(true);
    setOn(next);
    setFailed(false);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [payloadKey]: id, [field]: next }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setOn(!next);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={busy}
        className={`flex h-9 min-w-24 items-center justify-center border px-3 font-mono text-[10px] uppercase tracking-button transition-colors duration-base ease-out disabled:opacity-50 ${
          on
            ? "border-[var(--blade)] bg-blade text-bone"
            : "border-[var(--line-strong)] text-tertiary hover:border-bone hover:text-primary"
        }`}
      >
        {on ? onLabel : offLabel}
      </button>
      {failed && (
        <span role="alert" className="font-mono text-[10px] uppercase tracking-button text-blade-text">
          Failed
        </span>
      )}
    </span>
  );
}
