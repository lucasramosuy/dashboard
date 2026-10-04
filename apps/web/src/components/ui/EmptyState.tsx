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
    <div className="flex flex-col items-start gap-3 py-5 text-left">
      <span aria-hidden="true" className="text-theme-accent [&_svg]:w-6 [&_svg]:h-6">
        {icon || <Search />}
      </span>
      <h3 className="m-0 text-base font-semibold text-theme-text">{title}</h3>
      <p className="m-0 text-sm text-theme-text-muted max-w-lg leading-relaxed">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
