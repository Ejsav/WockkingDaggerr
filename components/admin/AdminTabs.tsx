"use client";

import { useId, useState, type ReactNode } from "react";

// Tab pattern per the WAI-ARIA authoring practices: arrow keys move
// between tabs, Home/End jump to the ends, and only the selected tab
// is in the tab order.
interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export default function AdminTabs({ tabs }: { tabs: Tab[] }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  function onKeyDown(e: React.KeyboardEvent) {
    const index = tabs.findIndex((t) => t.id === active);
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    setActive(tabs[next].id);
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Control room sections"
        onKeyDown={onKeyDown}
        className="no-scrollbar sticky top-nav z-30 -mx-gutter mt-8 flex gap-1 overflow-x-auto border-b border-[var(--line)] bg-ink/92 px-gutter backdrop-blur-md"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-4 font-mono text-[11px] uppercase tracking-button transition-colors duration-base ease-out ${
                selected
                  ? "border-[var(--blade)] text-primary"
                  : "border-transparent text-tertiary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-10 focus-visible:outline-none"
        >
          {tab.id === active && tab.content}
        </div>
      ))}
    </>
  );
}
