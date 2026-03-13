import React, { useEffect, useRef } from "react";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === dialogRef.current && !isLoading) {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        if (!isLoading) onCancel();
      }}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className={cn(
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "bg-surface dark:bg-surface-dark border border-zinc-200 dark:border-zinc-800",
        "w-[calc(100%-2rem)] max-w-md rounded-2xl shadow-elevated p-0",
        "open:animate-in open:fade-in-90 open:zoom-in-95 duration-200",
        // Resets
        "text-content dark:text-content-dark m-auto",
      )}
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h2 id="confirm-modal-title" className="text-xl font-bold m-0 mb-2">
              {title}
            </h2>
            <p
              id="confirm-modal-desc"
              className="text-content-secondary dark:text-content-dark-secondary text-sm m-0 leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 p-4 bg-zinc-50 dark:bg-surface-dark-secondary border-t border-zinc-200 dark:border-zinc-800 rounded-b-2xl">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-1/2"
        >
          {cancelText}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isLoading}
          className="w-full sm:w-1/2"
        >
          {confirmText}
        </Button>
      </div>
    </dialog>
  );
}
