import React, { useState, useEffect, useRef } from "react";
import { SidebarActions } from "../layout/SidebarActions";
import { Menu, X, BookOpen } from "lucide-react";

import { navItems } from "../../config/nav";

interface Props {
  currentPath: string;
}

export const MobileMenu: React.FC<Props> = ({ currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentLabel =
    navItems.find((i) => (i.href === "/" ? currentPath === "/" : currentPath.startsWith(i.href)))?.label ?? "";
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    const handleKeyDown = (e: KeyboardEvent) => {
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
      {/* Barra superior móvil: no tapa contenido como el botón flotante */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-theme-bg/90 backdrop-blur border-b border-theme-border">
        <a href="/" className="flex items-center gap-2 no-underline text-theme-text">
          <BookOpen size={20} />
          <span className="font-bold text-base">Mi Panel</span>
        </a>
        <span className="text-sm text-theme-text-muted truncate mx-3">{currentLabel}</span>
        <button
          ref={buttonRef}
          className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-theme-text hover:bg-theme-card-bg cursor-pointer bg-transparent border-none"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={isOpen}
          aria-controls="mobile-menu-dialog"
        >
          <Menu size={22} />
        </button>
      </div>
      {/* Modal / Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex justify-end animate-[fade-in_0.2s_ease-out]"
          onClick={handleBackdropClick}
          role="presentation"
        >
          {/* Diálogo */}
          <div
            id="mobile-menu-dialog"
            className="w-[80%] max-w-75 h-full bg-theme-bg/95 backdrop-blur-md shadow-[-8px_0_32px_rgba(0,0,0,0.15)] flex flex-col animate-[slide-in-right_0.3s_cubic-bezier(0.16,1,0.3,1)] focus:outline-none border-l border-theme-border/50"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de Navegación"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center p-5 border-b border-theme-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></span>
                <span className="text-lg font-bold tracking-tight text-theme-text">
                  Mi Panel
                </span>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full text-theme-text-muted hover:text-theme-text hover:bg-theme-card-bg transition-all duration-200 cursor-pointer"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={20} />
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
                      className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-theme-bg" : ""}`}
                    >
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className="text-base font-medium leading-none">
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </nav>

            <div
              className="p-4 pt-2 border-t border-theme-border/50 flex flex-col gap-2
              /* Common button styles */
              [&_button]:flex [&_button]:items-center [&_button]:gap-4 [&_button]:p-3.5 [&_button]:rounded-xl [&_button]:bg-transparent [&_button]:justify-start [&_button]:text-base [&_button]:font-medium [&_button]:w-full [&_button]:transition-all [&_button]:cursor-pointer
              [&_a]:flex [&_a]:items-center [&_a]:gap-4 [&_a]:p-3.5 [&_a]:rounded-xl [&_a]:bg-transparent [&_a]:justify-start [&_a]:text-base [&_a]:font-medium [&_a]:w-full [&_a]:transition-all [&_a]:no-underline

              /* Context specific colors and hovers */
              [&_.profile-btn]:text-theme-text [&_.profile-btn:hover]:bg-theme-card-bg
              [&_.theme-toggle-btn]:text-theme-text [&_.theme-toggle-btn:hover]:bg-theme-card-bg
              [&_.logout-btn]:text-theme-danger [&_.logout-btn:hover]:bg-theme-danger/8

              /* Icon and Label resets */
              [&_.sidebar-label]:block! [&_.sidebar-label]:opacity-100! [&_.sidebar-label]:max-w-none! [&_.sidebar-label]:ml-0!
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
