import React, { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-lg max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto">
        <header className="flex justify-between items-center border-b border-theme-border mb-4 pb-2">
          <h3 className="m-0 text-theme-text font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-2 py-1 rounded-lg border border-theme-border bg-transparent text-theme-text-muted hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150"
          >
            &times;
          </button>
        </header>
        {children}
      </div>
    </div>
  );
};
