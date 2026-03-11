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
        aria-label="Toggle theme"
        className="w-full flex items-center justify-start py-3 px-2 rounded-[10px] cursor-pointer bg-transparent border-none font-medium text-sm text-theme-text-muted hover:bg-theme-bg hover:text-theme-text group transition-colors theme-toggle-btn"
      >
        <span className="sidebar-icon-item">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </span>
        <span className="sidebar-label transition-[max-width,opacity,margin] duration-200 overflow-hidden max-w-0 opacity-0 ml-0 group-hover:max-w-200px group-hover:opacity-100 group-hover:ml-3">
          Cambiar tema
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-11 h-11 rounded-[10px] bg-theme-card-bg border border-theme-border shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center cursor-pointer hover:bg-theme-border hover:scale-110 active:scale-95 transition-all duration-200"
    >
      {theme === "light" ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
    </button>
  );
};
