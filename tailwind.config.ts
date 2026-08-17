import type { Config } from "tailwindcss";

// ============================================================
// Tailwind reads from the CSS custom properties in globals.css
// rather than redeclaring them. One place to change a colour,
// a line weight, or a duration.
// ============================================================

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          raise: "var(--ink-raise)",
          "raise-2": "var(--ink-raise-2)",
        },
        bone: "var(--bone)",
        blade: {
          DEFAULT: "var(--blade)",
          text: "var(--blade-text)",
        },
        gold: "var(--gold)",
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
      },
      borderColor: {
        faint: "var(--line-faint)",
        DEFAULT: "var(--line)",
        strong: "var(--line-strong)",
      },
      fontSize: {
        hero: ["var(--step-hero)", { lineHeight: "var(--leading-display)" }],
        display: ["var(--step-display)", { lineHeight: "var(--leading-display)" }],
        section: ["var(--step-section)", { lineHeight: "var(--leading-heading)" }],
        card: ["var(--step-card)", { lineHeight: "1.2" }],
        meta: ["var(--step-meta)", { lineHeight: "1.4" }],
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        eyebrow: "var(--tracking-eyebrow)",
        button: "var(--tracking-button)",
      },
      spacing: {
        nav: "var(--nav-h)",
        gutter: "var(--gutter)",
        section: "var(--section-y)",
      },
      maxWidth: {
        shell: "var(--shell)",
        measure: "var(--measure)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
      },
      screens: {
        // The narrowest phone still in real use. Layouts are checked here.
        xs: "360px",
      },
    },
  },
  plugins: [],
};

export default config;
