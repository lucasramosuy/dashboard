import { useStore } from "@nanostores/react";
import { themeStore, toggleTheme, initTheme } from "../../stores/theme";
import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = ({ variant = "floating" }: { variant?: "sidebar" | "floating" }) => {
  const theme = useStore(themeStore);

  useEffect(() => {
    initTheme();
  }, []);

  if (variant === "sidebar") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        className="theme-toggle-btn"
      >
        <span className="sidebar-icon-item">
          {theme === "light" ? (
            <Moon size={18} strokeWidth={1.75} />
          ) : (
            <Sun size={18} strokeWidth={1.75} />
          )}
        </span>
        <span className="sidebar-label">{theme === "light" ? "Tema oscuro" : "Tema claro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className="w-10 h-10 rounded-lg bg-transparent border border-theme-border text-theme-text flex items-center justify-center cursor-pointer active:scale-95 transition-colors [@media(hover:hover)]:hover:border-theme-accent"
    >
      {theme === "light" ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
    </button>
  );
};
