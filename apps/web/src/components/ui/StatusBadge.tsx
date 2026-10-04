import React from "react";
import { Chip } from "./PageHeader";

type BadgeVariant = "success" | "warning" | "danger" | "info";

interface Props {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const tones = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "accent",
} as const;

/** Estado con fondo tintado y punto (radio 8). */
export const StatusBadge: React.FC<Props> = ({ variant = "info", children, className = "" }) => (
  <Chip tone={tones[variant]} className={className}>
    {children}
  </Chip>
);
