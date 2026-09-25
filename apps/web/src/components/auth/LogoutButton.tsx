import React from "react";
import { signOutAndRedirect } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";

export const LogoutButton: React.FC = () => {
  return (
    <button onClick={signOutAndRedirect} className="logout-btn" aria-label="Cerrar sesión">
      <span className="sidebar-icon-item">
        <LogOut size={20} />
      </span>
      <span className="sidebar-label">Cerrar sesión</span>
    </button>
  );
};
