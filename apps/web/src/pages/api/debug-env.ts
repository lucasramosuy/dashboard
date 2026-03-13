// TEMPORAL: endpoint de diagnóstico — ELIMINAR después de confirmar el fix.
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const data = {
    process_PUBLIC_FRONTEND_ORIGIN: typeof process !== "undefined"
      ? (process.env.PUBLIC_FRONTEND_ORIGIN ?? "UNDEFINED")
      : "process not available",
    process_PUBLIC_API_BASE: typeof process !== "undefined"
      ? (process.env.PUBLIC_API_BASE ?? "UNDEFINED")
      : "process not available",
    import_meta_PUBLIC_FRONTEND_ORIGIN: import.meta.env.PUBLIC_FRONTEND_ORIGIN ?? "UNDEFINED",
    import_meta_PUBLIC_API_BASE: import.meta.env.PUBLIC_API_BASE ?? "UNDEFINED",
    NODE_ENV: typeof process !== "undefined" ? process.env.NODE_ENV : "unknown",
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
