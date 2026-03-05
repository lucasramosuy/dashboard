// src/lib/chart-theme.ts

export const chartTheme = {
  light: {
    background: "transparent",
    textColor: "#71717a", // zinc-500
    axisColor: "transparent",
    gridColor: "#f4f4f5", // zinc-100
    colors: [
      "#18181b", // zinc-900 (Primario general)
      "#71717a", // zinc-500
      "#a1a1aa", // zinc-400
      "#d4d4d8", // zinc-300
    ],
    // Paleta semántica para datos
    data: {
      success: "#16a34a", // green-600 — Completadas
      info: "#2563eb", // blue-600  — En Proceso
      warning: "#d97706", // amber-600 — Pendientes
      accent: "#7c3aed", // violet-600 — Acento extra
    },
    tooltip: {
      backgroundColor: "#ffffff",
      borderColor: "#e4e4e7",
      color: "#18181b",
    },
  },
  dark: {
    background: "transparent",
    textColor: "#a1a1aa", // zinc-400
    axisColor: "transparent",
    gridColor: "#27272a", // zinc-800
    colors: [
      "#fafafa", // zinc-50 (Primario general)
      "#a1a1aa", // zinc-400
      "#71717a", // zinc-500
      "#52525b", // zinc-600
    ],
    // Paleta semántica para datos
    data: {
      success: "#4ade80", // green-400 — Completadas
      info: "#60a5fa", // blue-400  — En Proceso
      warning: "#fbbf24", // amber-400 — Pendientes
      accent: "#a78bfa", // violet-400 — Acento extra
    },
    tooltip: {
      backgroundColor: "#18181b",
      borderColor: "#27272a",
      color: "#fafafa",
    },
  },
};

export function getChartTheme(isDark: boolean) {
  return isDark ? chartTheme.dark : chartTheme.light;
}
