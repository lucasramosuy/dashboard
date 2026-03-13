import React from "react";
import { ThemeToggle } from "../layout/ThemeToggle";
import { LogoutButton } from "../auth/LogoutButton";
import { ProfileButton } from "../profile/ProfileButton";

interface SidebarActionsProps {
  variant?: "sidebar" | "floating";
}

// ARCH-4: Removed nested ThemeProvider/AuthProvider — these are already
// provided at the app root. Nesting them caused duplicate contexts.
export const SidebarActions: React.FC<SidebarActionsProps> = ({ variant }) => {
  return (
    <div className="flex flex-col gap-1 w-full sidebar-actions-container">
      <ProfileButton />
      <ThemeToggle variant={variant} />
      <LogoutButton />
    </div>
  );
};
