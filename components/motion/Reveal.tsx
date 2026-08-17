import type { ElementType, ReactNode } from "react";

// ============================================================
// REVEAL PRIMITIVES — server components.
//
// They render markup and CSS state only. MotionProvider adds
// `.is-in` when the element scrolls into view. Nothing here
// ships JavaScript, and with JavaScript disabled the CSS in
// globals.css shows the content immediately.
// ============================================================

interface RevealProps {
  children: ReactNode;
  /** Siblings sharing a group animate in sequence. */
  group?: string;
  as?: ElementType;
  className?: string;
  /** Fixed delay in ms, for a hero beat that should not depend on order. */
  delay?: number;
}

export function Reveal({ children, group, as: Tag = "div", className, delay }: RevealProps) {
  return (
    <Tag
      data-reveal=""
      data-reveal-group={group}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * A display line that slides up out of a clipping mask.
 * One element per line — the mask has to wrap a single line of
 * text or the clip cuts the wrong place.
 */
export function MaskLine({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <span
      className={`line-mask ${className ?? ""}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      <span>{children}</span>
    </span>
  );
}
