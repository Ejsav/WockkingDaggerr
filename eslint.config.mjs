import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs directly — no FlatCompat needed.
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Nothing user-visible may ship debug output. lib/log is the
      // sanctioned channel and it uses warn/error deliberately.
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Operator CLI scripts. Printing to stdout is their entire purpose;
    // the no-console rule exists to keep debug output out of the app.
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
];

export default config;
