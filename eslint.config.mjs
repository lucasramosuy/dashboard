import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: ["**/dist/**", "**/.astro/**", "**/node_modules/**", "**/*.d.ts"],
  },
  // Base JS + globals compartidos
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Bun: "readonly",
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        fetch: "readonly",
        Response: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },

  // TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      "no-unused-vars": "off", // base rule
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "after-used" /* y cualquier otra opción que quieras */ },
      ],
    },
  },

  // Astro
  ...astro.configs["recommended"],
];
