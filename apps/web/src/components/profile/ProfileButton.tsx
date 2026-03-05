import React from "react";
import { User } from "lucide-react";

export const ProfileButton: React.FC = () => {
  return (
    <a href="/profile" className="profile-btn" aria-label="Ver perfil">
      <span className="sidebar-icon-item">
        <User size={20} />
      </span>
      <span className="sidebar-label">Mi cuenta</span>
    </a>
  );
};
