import { url } from "@/lib/utils";
import React from "react";
import { User } from "lucide-react";

export const ProfileButton: React.FC = () => {
  return (
    <a href={url("/profile")} className="profile-btn" aria-label="Ver perfil">
      <span className="sidebar-icon-item">
        <User size={18} strokeWidth={1.75} />
      </span>
      <span className="sidebar-label">Mi perfil</span>
    </a>
  );
};
