import React from "react";

export const ProfileButton: React.FC = () => {
  return (
    <a href="/profile" className="profile-btn" aria-label="Ver perfil">
      <span className="sidebar-icon-item">👤</span>
      <span className="sidebar-label">Mi cuenta</span>
    </a>
  );
};
