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
        className="flex md:hidden fixed bottom-8 right-8 w-[60px] h-[60px] rounded-xl bg-theme-primary text-theme-bg items-center justify-center text-2xl shadow-lg z-50 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 cursor-pointer"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-dialog"
      >
        <span>☰</span>
      </button>

      {/* Modal / Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex justify-end animate-[fadeIn_0.2s_ease-out]"
          onClick={handleBackdropClick}
          role="presentation"
        >
          {/* Diálogo */}
          <div
            id="mobile-menu-dialog"
            className="w-[80%] max-w-[300px] h-full bg-theme-bg/95 backdrop-blur-md shadow-[-8px_0_32px_rgba(0,0,0,0.15)] flex flex-col animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)] focus:outline-none border-l border-theme-border/50"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de Navegación"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center p-5 border-b border-theme-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></span>
                <span className="text-lg font-extrabold tracking-tight text-theme-text uppercase">
                  Mi Panel
                </span>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full text-theme-text-muted hover:text-theme-text hover:bg-theme-card-bg transition-all duration-200 cursor-pointer"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú"
              >
                <span className="text-lg leading-none">✕</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = item.href === currentPath;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-4 p-3.5 rounded-xl no-underline transition-all duration-200 ${
                      isActive
                        ? "bg-theme-primary text-theme-bg shadow-md"
                        : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card-bg"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-1/2 bg-theme-bg rounded-r-full"></span>
                    )}
                    <span
                      className={`text-xl transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-theme-bg" : ""}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-base font-semibold tracking-wide uppercase leading-none">
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </nav>

            <div
              className="p-4 pt-2 border-t border-theme-border/50 flex flex-col gap-2
              /* Common button styles */
              [&_button]:flex [&_button]:items-center [&_button]:gap-4 [&_button]:p-3.5 [&_button]:rounded-xl [&_button]:bg-transparent [&_button]:justify-start [&_button]:text-base [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-wide [&_button]:w-full [&_button]:transition-all [&_button]:cursor-pointer
              [&_a]:flex [&_a]:items-center [&_a]:gap-4 [&_a]:p-3.5 [&_a]:rounded-xl [&_a]:bg-transparent [&_a]:justify-start [&_a]:text-base [&_a]:font-bold [&_a]:uppercase [&_a]:tracking-wide [&_a]:w-full [&_a]:transition-all [&_a]:no-underline

              /* Context specific colors and hovers */
              [&_.profile-btn]:text-theme-text [&_.profile-btn:hover]:bg-theme-card-bg
              [&_.theme-toggle-btn]:text-theme-text [&_.theme-toggle-btn:hover]:bg-theme-card-bg
              [&_.logout-btn]:text-theme-danger [&_.logout-btn:hover]:bg-theme-danger/8

              /* Icon and Label resets */
              [&_.sidebar-label]:block! [&_.sidebar-label]:opacity-100! [&_.sidebar-label]:max-w-none! [&_.sidebar-label]:ml-0! [&_.sidebar-label]:uppercase
              [&_.sidebar-icon-item]:text-xl [&_.sidebar-icon-item]:w-auto [&_.sidebar-icon-item]:m-0"
            >
              <SidebarActions variant="sidebar" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
