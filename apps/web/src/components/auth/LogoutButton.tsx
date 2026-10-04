import React from "react";
import { signOutAndRedirect } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";

export const LogoutButton: React.FC = () => {
  return (
    <button onClick={signOutAndRedirect} className="logout-btn" aria-label="Cerrar sesión">
      <span className="sidebar-icon-item">
        <LogOut size={18} strokeWidth={1.75} />
      </span>
      <span className="sidebar-label">Salir</span>
    </button>
  );
};
