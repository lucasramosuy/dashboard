import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../layout/ThemeToggle";

export const HeaderBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user && <span className="text-sm text-theme-text-muted">{user.name}</span>}
      <ThemeToggle />
      {user && (
        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150"
        >
          Salir
        </button>
      )}
    </div>
  );
};
