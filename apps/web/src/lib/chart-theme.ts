// src/lib/chart-theme.ts
// Paleta de gráficos de panel.: papel + tinta + pizarra, estados tintados.

export const chartTheme = {
  light: {
    background: "transparent",
    textColor: "#666b70",
    axisColor: "transparent",
    gridColor: "#e3e1da",
    colors: ["#1b1f24", "#3d6b8e", "#8a8f94", "#d2d0c8"],
    // Paleta semántica para datos
    data: {
      success: "#2f6f55", // Completadas
      danger: "#9a3b32",
      info: "#3d6b8e", // En proceso (acento)
      warning: "#946017", // Pendientes
      accent: "#3d6b8e",
    },
    tooltip: {
      backgroundColor: "#fcfbf8",
      borderColor: "#e3e1da",
      color: "#1b1f24",
    },
  },
  dark: {
    background: "transparent",
    textColor: "#9a9ea1",
    axisColor: "transparent",
    gridColor: "#252a2e",
    colors: ["#eceae4", "#8db5d3", "#9a9ea1", "#4d5257"],
    data: {
      success: "#7fc3a2",
      danger: "#e08a80",
      info: "#8db5d3",
      warning: "#e0b068",
      accent: "#8db5d3",
    },
    tooltip: {
      backgroundColor: "#161a1d",
      borderColor: "#252a2e",
      color: "#eceae4",
    },
  },
};

export function getChartTheme(isDark: boolean) {
  return isDark ? chartTheme.dark : chartTheme.light;
}
