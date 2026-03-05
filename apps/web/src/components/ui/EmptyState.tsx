import React from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-surface-dark-secondary/20">
      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-6 shrink-0 shadow-sm">
        {icon || <Search className="w-8 h-8" strokeWidth={1.5} />}
      </div>

      <h3 className="text-lg font-semibold text-content dark:text-content-dark m-0 mb-2">
        {title}
      </h3>

      <p className="text-sm text-content-secondary dark:text-content-dark-secondary m-0 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
