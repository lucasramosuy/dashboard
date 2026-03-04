import { useStore } from "@nanostores/react";
import { themeStore, toggleTheme, initTheme } from "../stores/theme";
import { useEffect } from "react";

export const ThemeToggle = ({ variant = "floating" }: { variant?: "sidebar" | "floating" }) => {
  const theme = useStore(themeStore);

  useEffect(() => {
    initTheme();
  }, []);

  if (variant === "sidebar") {
    return (
      <button onClick={toggleTheme} aria-label="Toggle theme" className="theme-toggle-btn">
        <span className="sidebar-icon-item">{theme === "light" ? "🌙" : "☀️"}</span>
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} aria-label="Toggle theme" className="mobile-theme-btn">
      <span>{theme === "light" ? "🌙" : "☀️"}</span>
    </button>
  );
};
