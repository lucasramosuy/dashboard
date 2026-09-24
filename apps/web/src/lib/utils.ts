import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ARCH-9: formatDate removed — canonical version lives in lib/format.ts

/**
 * Arma una ruta interna con el base de Astro ("/dashboard").
 * url("/tasks") → "/dashboard/tasks"; url("/") → "/dashboard/".
 */
export function url(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
}
