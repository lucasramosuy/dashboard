import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Select con la identidad de panel.: botón + lista propia, sin el desplegable
 * nativo del navegador. La lista va en un portal con posición fija para que el
 * contenedor con scroll (modal) no la recorte ni la tape el campo siguiente.
 */
export const Select: React.FC<Props> = ({
  id,
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  required,
  disabled,
  className,
  ariaLabel,
}) => {
  const autoId = useId();
  const baseId = id || autoId;
  const listId = `${baseId}-list`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; up: boolean }>();

  const selected = options.find((o) => o.value === value);
  const enabledIdx = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const place = useCallback(() => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const h = Math.min(options.length * 40 + 12, 280);
    const up = window.innerHeight - r.bottom < h + 12 && r.top > h + 12;
    setRect({ left: r.left, top: up ? r.top - 6 : r.bottom + 6, width: r.width, up });
  }, [options.length]);

  const openList = () => {
    if (disabled) return;
    place();
    const i = options.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : (enabledIdx[0] ?? -1));
    setOpen(true);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) btnRef.current?.focus();
  };
  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    close();
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && active >= 0) {
      listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  const move = (dir: 1 | -1) => {
    const pos = enabledIdx.indexOf(active);
    const next = enabledIdx[Math.min(Math.max(pos + dir, 0), enabledIdx.length - 1)];
    if (next !== undefined) setActive(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(enabledIdx[0] ?? -1);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(enabledIdx[enabledIdx.length - 1] ?? -1);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Tab" && open) {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-button border bg-transparent px-3 text-left text-sm transition-colors",
          "border-zinc-200 dark:border-zinc-800 focus:outline-none focus-visible:border-theme-accent",
          open && "border-theme-accent",
          selected ? "text-content dark:text-content-dark" : "text-content-secondary",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-content-secondary transition-transform",
            open && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          onFocus={() => btnRef.current?.focus()}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}
      {open &&
        rect &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              left: rect.left,
              width: rect.width,
              top: rect.up ? undefined : rect.top,
              bottom: rect.up ? window.innerHeight - rect.top : undefined,
              zIndex: 2000,
              maxHeight: 280,
            }}
            className="m-0 list-none overflow-y-auto rounded-button border border-zinc-200 bg-surface p-1.5 shadow-lg dark:border-zinc-800 dark:bg-surface-dark"
          >
            {options.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={o.value || `__${i}`}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(i)}
                  className={cn(
                    "flex h-9 cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 text-sm text-content dark:text-content-dark",
                    i === active && "bg-zinc-100 dark:bg-zinc-800",
                    isSel && "font-medium",
                    o.disabled && "cursor-default opacity-50",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme-accent"
                    />
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
};
