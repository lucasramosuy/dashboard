import { atom } from "nanostores";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("dash_theme") as Theme | null;
    if (saved) return saved;
  }
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export const themeStore = atom<Theme>("light");

// Inicializar en cliente
export function initTheme() {
  const t = getInitialTheme();
  themeStore.set(t);
  document.documentElement.dataset.theme = t;
}

export function toggleTheme() {
  const next = themeStore.get() === "light" ? "dark" : "light";
  themeStore.set(next);
  localStorage.setItem("dash_theme", next);
  document.documentElement.dataset.theme = next;
}

