import React, { useEffect } from "react";

interface Props {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-9999 px-6 py-4 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center gap-3 animate-[slideUp_0.2s_ease] ${
        type === "success" ? "bg-theme-success" : "bg-theme-danger"
      }`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
      <button
        onClick={onClose}
        className="bg-transparent border-none text-white cursor-pointer text-base p-0 leading-none"
      >
        ×
      </button>
    </div>
  );
};
