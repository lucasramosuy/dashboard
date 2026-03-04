import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { ProfileButton } from "./ProfileButton";

interface SidebarActionsProps {
  variant?: "sidebar" | "floating";
}

export const SidebarActions: React.FC<SidebarActionsProps> = ({ variant }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
          <ProfileButton />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
            <ThemeToggle variant={variant} />
            <LogoutButton />
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};
