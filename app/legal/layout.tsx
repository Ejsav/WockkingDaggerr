import type { ReactNode } from "react";

// Shared measure and vertical rhythm for legal copy. Long-form reading
// gets a narrower column than the rest of the site.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-gutter pb-section pt-12 md:pt-20">
      <article
        className="
          [&_h1]:font-display [&_h1]:text-[clamp(2.25rem,6vw,4rem)] [&_h1]:uppercase
          [&_h1]:leading-[0.95] [&_h1]:tracking-display
          [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[clamp(1.25rem,2.5vw,1.75rem)]
          [&_h2]:uppercase [&_h2]:tracking-display
          [&_p]:mt-4 [&_p]:text-[var(--text-secondary)] [&_p]:leading-[1.65]
          [&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:list-disc
          [&_li]:text-[var(--text-secondary)] [&_li]:leading-[1.65]
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4
          [&_strong]:text-primary [&_strong]:font-medium
        "
      >
        {children}
      </article>
    </div>
  );
}
