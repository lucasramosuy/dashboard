export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Estados de interacción (papel + tinta)
        interactive: {
          DEFAULT: "#1b1f24",
          hover: "#2c3238",
          active: "#0f1214",
          dark: "#eceae4",
          "dark-hover": "#ffffff",
        },
        success: {
          DEFAULT: "#2f6f55",
          light: "#e6efe9",
          dark: "#7fc3a2",
        },
        warning: {
          DEFAULT: "#946017",
          light: "#f2eadb",
          dark: "#e0b068",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
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
        bento: "0.75rem", // 12px
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
