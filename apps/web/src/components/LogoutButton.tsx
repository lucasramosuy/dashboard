import React from "react";

export const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <button onClick={handleLogout} className="logout-btn" aria-label="Cerrar sesión">
      <span className="sidebar-icon-item">🚪</span>
      <span className="sidebar-label">Cerrar sesión</span>
    </button>
  );
};
