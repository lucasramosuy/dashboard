import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ThemeToggle } from '../layout/ThemeToggle';
import { LogoutButton } from '../auth/LogoutButton';
import { ProfileButton } from '../profile/ProfileButton';

interface SidebarActionsProps {
  variant?: "sidebar" | "floating";
}

export const SidebarActions: React.FC<SidebarActionsProps> = ({ variant }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex flex-col gap-1 w-full sidebar-actions-container">
          <ProfileButton />
          <ThemeToggle variant={variant} />
          <LogoutButton />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};
