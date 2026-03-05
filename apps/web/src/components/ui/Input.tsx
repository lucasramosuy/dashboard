import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "placeholder"> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    // Generar un id único si no se provee uno (útil para accesibilidad entre label e input)
    const inputId = id || React.useId();

    return (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          placeholder=" " // Necesario para que Tailwind detecte :placeholder-shown
          className={cn(
            "peer h-10 w-full rounded-button border bg-transparent px-3 py-2 text-sm placeholder:text-transparent",
            "border-zinc-200 text-content focus:border-zinc-900 dark:border-zinc-800 dark:text-content-dark",
            "transition-colors focus:outline-none focus:ring-0",
            error &&
              "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500",
            className,
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-secondary transition-all cursor-text pointer-events-none",
            // Cuando tiene foco
            "peer-focus:top-0 peer-focus:bg-surface peer-focus:px-1 dark:peer-focus:bg-surface-dark",
            // Cuando NO tiene el placeholder visible (es decir, tiene texto)
            "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-surface dark:peer-[:not(:placeholder-shown)]:bg-surface-dark",
            "peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs",
            // Estados de error
            error &&
              "text-red-500 dark:text-red-500 peer-focus:text-red-500 dark:peer-focus:text-red-500",
          )}
        >
          {label}
        </label>
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
