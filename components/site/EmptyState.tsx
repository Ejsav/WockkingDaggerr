import Link from "next/link";
import type { ReactNode } from "react";

// ============================================================
// EMPTY STATE
//
// Used wherever there is genuinely nothing to show. It says so
// plainly and offers the next useful action. This is the
// alternative to filling a gap with invented content.
// ============================================================

export default function EmptyState({
  eyebrow,
  title,
  body,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: { label: string; href: string; external?: boolean };
  children?: ReactNode;
}) {
  return (
    <div className="border border-faint bg-surface-1 px-gutter py-16 text-center md:py-24">
      {eyebrow && <p className="eyebrow-accent mb-4">{eyebrow}</p>}
      <h2 className="display mx-auto max-w-2xl text-section">{title}</h2>
      <p className="prose-body mx-auto mt-5 text-balance">{body}</p>
      {action &&
        (action.external ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary mt-8"
          >
            <span>{action.label}</span>
          </a>
        ) : (
          <Link href={action.href} className="btn btn-secondary mt-8">
            <span>{action.label}</span>
          </Link>
        ))}
      {children}
    </div>
  );
}
