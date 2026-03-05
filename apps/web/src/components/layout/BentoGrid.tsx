import React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  noHoverShadow?: boolean;
}

export function BentoCard({
  children,
  className,
  size = "sm",
  noHoverShadow = false,
}: BentoCardProps) {
  const sizes = {
    sm: "col-span-1 row-span-1",
    md: "col-span-2 row-span-1",
    lg: "col-span-2 row-span-2",
    full: "col-span-4 row-span-2", // Solo para lg screens, mapeado en la grid a 4 columnas
  };

  return (
    <div
      className={cn(
        "rounded-bento border border-zinc-200 bg-surface p-6 dark:border-zinc-800 dark:bg-surface-dark-secondary transition-shadow",
        sizes[size],
        !noHoverShadow && "hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
