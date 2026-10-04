import React from "react";

/** Wordmark del producto: "panel." con el punto en el acento. */
export const Wordmark: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`wordmark ${className}`} aria-label="panel.">
    panel<span className="wordmark-dot">.</span>
  </span>
);
