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
    "inline-flex items-center justify-center rounded-button font-medium transition-all duration-150 focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-interactive text-surface hover:bg-interactive-hover dark:bg-interactive-dark dark:text-surface-dark dark:hover:bg-interactive-dark-hover",
    secondary:
      "border border-zinc-200 bg-surface hover:bg-zinc-50 dark:border-zinc-800 dark:bg-surface-dark-secondary dark:hover:bg-surface-dark-tertiary",
    ghost:
      "text-content-secondary hover:bg-zinc-100 hover:text-content dark:text-content-dark-secondary dark:hover:bg-zinc-900 dark:hover:text-content-dark",
    danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
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
