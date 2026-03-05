import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success:
      "bg-surface border-green-200 text-content dark:bg-zinc-900 border-l-[4px] border-l-green-500 dark:border-zinc-800 dark:text-zinc-100",
    error:
      "bg-surface border-red-200 text-content dark:bg-zinc-900 border-l-[4px] border-l-red-500 dark:border-zinc-800 dark:text-zinc-100",
    info: "bg-surface border-blue-200 text-content dark:bg-zinc-900 border-l-[4px] border-l-blue-500 dark:border-zinc-800 dark:text-zinc-100",
  };

  const icons = {
    success: <CheckCircle2 className="text-green-500 h-5 w-5 shrink-0" strokeWidth={2.5} />,
    error: <AlertCircle className="text-red-500 h-5 w-5 shrink-0" strokeWidth={2.5} />,
    info: <AlertCircle className="text-blue-500 h-5 w-5 shrink-0" strokeWidth={2.5} />,
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-[--mobile-nav-height] md:bottom-8 right-4 md:right-8 z-50 w-full max-w-sm overflow-hidden rounded-lg shadow-elevated border flex items-start gap-4 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles[type]}`}
      style={{ "--mobile-nav-height": "100px" } as React.CSSProperties}
    >
      {icons[type]}
      <p className="m-0 text-sm font-medium flex-1 pt-0.5">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors bg-transparent border-none cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
