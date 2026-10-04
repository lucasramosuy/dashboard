import { containDialogFocus } from "../ui/dialog-focus";
import React, { useState, useEffect, useRef } from "react";
import { SidebarActions } from "../layout/SidebarActions";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";

import { navItems } from "../../config/nav";
import { url } from "@/lib/utils";

interface Props {
  currentPath: string;
}

export const MobileMenu: React.FC<Props> = ({ currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
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

  // Manejo de clicks fuera del diálogo
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Barra superior móvil: menú a la izquierda, wordmark centrado, tema a la derecha */}
      <div className="md:hidden sticky top-0 z-50 grid grid-cols-[2.75rem_1fr_2.75rem] items-center h-16 px-4 bg-theme-bg border-b border-theme-border">
        <button
          ref={buttonRef}
          className="w-11 h-11 -ml-2 rounded-lg flex items-center justify-center text-theme-text [@media(hover:hover)]:hover:bg-theme-soft cursor-pointer bg-transparent border-none"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={isOpen}
          aria-controls="mobile-menu-dialog"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <a
          href={url("/")}
          className="justify-self-center no-underline text-xl"
          aria-label="panel. — inicio"
        >
          <Wordmark />
        </a>
        <div className="justify-self-end -mr-2">
          <ThemeToggle />
        </div>
      </div>
      {/* Modal / Backdrop */}
      <dialog
        onKeyDown={containDialogFocus}
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        aria-label="Menú de navegación"
        id="mobile-menu-dialog"
        className="m-0 p-0 w-full h-dvh max-w-none max-h-none border-0 bg-transparent backdrop:bg-black/40"
      >
        {isOpen && (
          <div
            className="w-full h-full flex justify-start"
            onClick={handleBackdropClick}
            role="presentation"
          >
            {/* Diálogo */}
            <div
              className="mobile-menu-dialog w-[84%] max-w-80 h-full bg-theme-bg flex flex-col animate-[slide-in_0.25s_cubic-bezier(0.16,1,0.3,1)] focus:outline-none border-r border-theme-border"
              tabIndex={-1}
            >
              <div className="flex justify-between items-center p-5 border-b border-theme-border">
                <span className="text-2xl">
                  <Wordmark />
                </span>
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-theme-text-muted [@media(hover:hover)]:hover:text-theme-text [@media(hover:hover)]:hover:bg-theme-soft transition-all duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 custom-scrollbar">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);
                  return (
                    <a
                      key={item.href}
                      href={url(item.href)}
                      className={`group relative flex items-center gap-3.5 px-3.5 py-3 rounded-lg no-underline transition-colors duration-200 ${
                        isActive
                          ? "mobile-menu-active-link text-theme-text"
                          : "text-theme-text-muted [@media(hover:hover)]:hover:text-theme-text [@media(hover:hover)]:hover:bg-theme-soft"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>
                        <item.icon size={20} strokeWidth={1.75} />
                      </span>
                      <span className="text-base font-medium leading-none">{item.label}</span>
                    </a>
                  );
                })}
              </nav>

              <div
                className="p-4 pt-2 border-t border-theme-border flex flex-col gap-2
              /* Common button styles */
              [&_button]:flex [&_button]:items-center [&_button]:gap-3.5 [&_button]:px-3.5 [&_button]:py-3 [&_button]:rounded-lg [&_button]:bg-transparent [&_button]:justify-start [&_button]:text-base [&_button]:font-medium [&_button]:w-full [&_button]:transition-all [&_button]:cursor-pointer
              [&_a]:flex [&_a]:items-center [&_a]:gap-3.5 [&_a]:px-3.5 [&_a]:py-3 [&_a]:rounded-lg [&_a]:bg-transparent [&_a]:justify-start [&_a]:text-base [&_a]:font-medium [&_a]:w-full [&_a]:transition-all [&_a]:no-underline

              /* Context specific colors */
              [&_.profile-btn]:text-theme-text
              [&_.theme-toggle-btn]:text-theme-text
              [&_.logout-btn]:text-theme-danger

              /* Icon and Label resets */
              [&_.sidebar-label]:block! [&_.sidebar-label]:opacity-100! [&_.sidebar-label]:max-w-none! [&_.sidebar-label]:ml-0!
              [&_.sidebar-icon-item]:text-xl [&_.sidebar-icon-item]:w-auto [&_.sidebar-icon-item]:m-0"
              >
                <SidebarActions variant="sidebar" />
              </div>
            </div>
          </div>
        )}
      </dialog>
      <style>{`
        .mobile-menu-active-link {
          background: color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg));
          color: var(--theme-text);
        }

        .mobile-menu-dialog,
        .mobile-menu-dialog * {
          -webkit-tap-highlight-color: transparent;
        }

        @media (hover: hover) {
          .mobile-menu-dialog .profile-btn:hover,
          .mobile-menu-dialog .theme-toggle-btn:hover {
            background: color-mix(in srgb, var(--theme-text) 5%, var(--theme-bg));
          }

          .mobile-menu-dialog .logout-btn:hover {
            background: color-mix(in srgb, var(--theme-danger) 8%, transparent);
          }
        }
      `}</style>
    </>
  );
};
