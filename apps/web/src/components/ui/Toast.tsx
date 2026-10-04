import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type = "success", onClose }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    success: "bg-theme-card-bg border-theme-border text-theme-text",
    error: "bg-theme-card-bg border-theme-border text-theme-text",
    info: "bg-theme-card-bg border-theme-border text-theme-text",
  };

  const dot = (cls: string) => (
    <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cls}`} />
  );
  const icons = {
    success: dot("bg-theme-success"),
    error: dot("bg-theme-danger"),
    info: dot("bg-theme-accent"),
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-[--mobile-nav-height] md:bottom-8 right-4 md:right-8 z-50 w-full max-w-sm overflow-hidden rounded-xl border flex items-start gap-4 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles[type]}`}
      style={{ "--mobile-nav-height": "100px" } as React.CSSProperties}
    >
      {icons[type]}
      <p className="m-0 text-sm font-medium flex-1 pt-0.5">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-theme-text-muted [@media(hover:hover)]:hover:text-theme-text transition-colors bg-transparent border-none cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
