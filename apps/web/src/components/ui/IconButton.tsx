import React from "react";

interface Props extends React.ComponentPropsWithoutRef<"button"> {
  label: string;
  danger?: boolean;
}

/** Botón de ícono discreto (editar/eliminar) con tooltip y aria-label. */
export const IconButton: React.FC<Props> = ({ label, danger, className = "", children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`w-9 h-9 inline-flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-theme-text-muted transition-colors ${
      danger ? "[@media(hover:hover)]:hover:text-theme-danger [@media(hover:hover)]:hover:bg-theme-danger-light" : "[@media(hover:hover)]:hover:text-theme-text [@media(hover:hover)]:hover:bg-theme-soft"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);
