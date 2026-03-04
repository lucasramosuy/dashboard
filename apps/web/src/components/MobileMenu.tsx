import React, { useState, useEffect, useRef } from "react";
import { SidebarActions } from "./SidebarActions";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface Props {
  navItems: NavItem[];
  currentPath: string;
}

export const MobileMenu: React.FC<Props> = ({ navItems, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<globalThis.HTMLDivElement>(null);
  const buttonRef = useRef<globalThis.HTMLButtonElement>(null);

  // Focus trap y body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      buttonRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Manejo de clicks fuera del diálogo
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        ref={buttonRef}
        className="mobile-menu-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-dialog"
      >
        <span>☰</span>
      </button>

      {/* Modal / Backdrop */}
      {isOpen && (
        <div className="mobile-menu-backdrop" onClick={handleBackdropClick} role="presentation">
          {/* Diálogo */}
          <div
            id="mobile-menu-dialog"
            className="mobile-menu-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de Navegación"
            tabIndex={-1}
          >
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Mi Panel</span>
              <button
                className="mobile-menu-close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <nav className="mobile-menu-nav">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`mobile-menu-link ${item.href === currentPath ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="mobile-menu-icon">{item.icon}</span>
                  <span className="mobile-menu-label">{item.label}</span>
                </a>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              <SidebarActions variant="sidebar" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
