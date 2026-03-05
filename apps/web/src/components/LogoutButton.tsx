import React from "react";
import { useAuth } from "../contexts/AuthContext";

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth();

  return (
    <button onClick={logout} className="logout-btn" aria-label="Cerrar sesión">
      <span className="sidebar-icon-item">🚪</span>
      <span className="sidebar-label">Cerrar sesión</span>
    </button>
  );
};
