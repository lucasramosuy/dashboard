import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

interface SidebarActionsProps {
  variant?: "sidebar" | "floating";
}

export const SidebarActions: React.FC<SidebarActionsProps> = ({ variant }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeToggle variant={variant} />
        <LogoutButton />
      </AuthProvider>
    </ThemeProvider>
  );
};
