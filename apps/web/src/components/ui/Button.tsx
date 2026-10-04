import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-button font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer";

  const variants = {
    primary:
      "bg-theme-primary text-theme-bg border border-transparent [@media(hover:hover)]:hover:opacity-90",
    secondary:
      "border border-theme-border bg-theme-card-bg text-theme-text [@media(hover:hover)]:hover:border-theme-accent",
    ghost:
      "text-theme-text-muted [@media(hover:hover)]:hover:bg-theme-soft [@media(hover:hover)]:hover:text-theme-text",
    danger:
      "bg-theme-danger-light text-theme-danger border border-transparent [@media(hover:hover)]:hover:opacity-80",
  };

  const sizes = {
    sm: "h-9 px-3.5 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
