import { containDialogFocus } from "./dialog-focus";
import React, { useEffect, useId, useRef } from "react";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Modal: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      onKeyDown={containDialogFocus}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            closeRef.current();
        }
      }}
      className="m-auto bg-theme-card-bg text-theme-text border border-theme-border rounded-xl p-6 shadow-lg max-w-[500px] w-[90%] max-h-[90dvh] overflow-y-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {isOpen && (
        <>
          <header className="flex justify-between items-center gap-4 border-b border-theme-border mb-4 pb-2">
            <h2 id={titleId} className="m-0 text-theme-text text-lg font-bold">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Cerrar diálogo"
              onClick={onClose}
              className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-lg border border-theme-border bg-transparent text-theme-text-muted hover:bg-theme-soft cursor-pointer"
            >
              ×
            </button>
          </header>
          {children}
        </>
      )}
    </dialog>
  );
};
