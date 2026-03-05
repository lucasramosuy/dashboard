export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Fondos
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#fafafa",
          tertiary: "#f4f4f5",
          dark: "#09090b",
          "dark-secondary": "#18181b",
          "dark-tertiary": "#27272a",
        },
        // Contenido
        content: {
          DEFAULT: "#18181b", // zinc-900
          secondary: "#71717a", // zinc-500
          tertiary: "#a1a1aa", // zinc-400
          dark: "#fafafa", // zinc-50
          "dark-secondary": "#a1a1aa", // zinc-400
        },
        // Estados de interacción
        interactive: {
          DEFAULT: "#18181b",
          hover: "#27272a",
          active: "#09090b",
          dark: "#fafafa",
          "dark-hover": "#e4e4e7",
        },
      },
      fontFamily: {
        sans: ["Inter Variable", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
      },
      spacing: {
        // Escala 4px base
        4.5: "1.125rem", // 18px - útil para inputs
        18: "4.5rem", // 72px
      },
      borderRadius: {
        button: "0.5rem", // 8px
        card: "0.75rem", // 12px
        bento: "1rem", // 16px
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
        elevated: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        glass: "0 8px 32px 0 rgb(0 0 0 / 0.08)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
};
