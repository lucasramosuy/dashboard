import React, { useEffect } from "react";

interface Props {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({
  message,
  type = "success",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999,
        padding: "1rem 1.5rem",
        borderRadius: "12px",
        backgroundColor:
          type === "success" ? "var(--oat-success)" : "var(--oat-danger)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.875rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        animation: "slideUp 0.2s ease",
      }}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: "1rem",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
};
