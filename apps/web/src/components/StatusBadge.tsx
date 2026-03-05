import React from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info";

interface Props {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-theme-success-light text-theme-success [html[data-theme=dark]_&]:text-[#4ade9a]",
  warning: "bg-theme-warning-light text-theme-warning [html[data-theme=dark]_&]:text-[#f5c36d]",
  danger: "bg-theme-danger-light text-theme-danger [html[data-theme=dark]_&]:text-[#f87171]",
  info: "bg-theme-info-light text-theme-info [html[data-theme=dark]_&]:text-[#7db8f7]",
};

export const StatusBadge: React.FC<Props> = ({ variant = "info", children, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
