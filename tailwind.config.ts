import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          900: "#0a0a0a",
          800: "#121212",
          700: "#1a1a1a",
          600: "#222222",
          500: "#2c2c2c",
        },
        bone: {
          DEFAULT: "#f5f1ea",
          50: "#fdfcfa",
          100: "#f5f1ea",
          200: "#e8e2d5",
          300: "#c9c0ad",
        },
        blade: {
          DEFAULT: "#c8102e",
          50: "#ffe7eb",
          400: "#e63b54",
          500: "#c8102e",
          600: "#a00922",
          700: "#770818",
        },
        gold: {
          DEFAULT: "#c9a24a",
          400: "#e3c074",
          500: "#c9a24a",
          600: "#9c7a2e",
        },
      },
      letterSpacing: {
        wider: ".08em",
        widest: ".22em",
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.6s ease-out both",
        "scale-in": "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        marquee: "marquee 40s linear infinite",
        pulse_blade: "pulseBlade 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseBlade: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
