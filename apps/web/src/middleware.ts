import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/astro";
import { logger } from "./lib/logger";

const PUBLIC_ROUTES = ["/login"];
const IGNORED_PREFIXES = ["/api", "/_", "/_image"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function isIgnoredRoute(pathname: string): boolean {
  return IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// URL de la API para el middleware SSR (server-to-server).
// INTERNAL_API_BASE es una variable de entorno RUNTIME (no build-time) que permite
// apuntar al origen interno de Render (http://dashboard-api:8787/api) para evitar
// pasar por Cloudflare en los requests server-to-server de validación de sesión.
// Si no está definida, cae a PUBLIC_API_BASE (build-time) y luego al default.
const API_BASE =
  (typeof process !== "undefined" && process.env.INTERNAL_API_BASE?.trim()) ||
  (import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
    ? import.meta.env.PUBLIC_API_BASE
    : "http://localhost:8787/api");

// El origen del frontend: Better Auth valida este valor contra trustedOrigins.
// Usamos process.env como fuente primaria (runtime, siempre disponible en Node SSR),
// con import.meta.env como fallback (build-time, bakeado por Vite/Astro).
// NUNCA debe ser localhost en prod — si lo es, Better Auth rechazará todas las sesiones.
const FRONTEND_ORIGIN =
  (typeof process !== "undefined" && process.env.PUBLIC_FRONTEND_ORIGIN?.trim()) ||
  (import.meta.env.PUBLIC_FRONTEND_ORIGIN?.trim()) ||
  "http://localhost:4321";

async function validateSession(
  request: Request,
  cookieHeader: string,
): Promise<{ valid: boolean; user?: Record<string, unknown>; reason?: string }> {
  try {
    const fetchHeaders = new Headers();
    fetchHeaders.set("Cookie", cookieHeader);
    fetchHeaders.set("Accept", "application/json");

    // Better Auth valida Origin contra trustedOrigins. Enviamos el origen del frontend
    // (que está en trustedOrigins) en lugar del origen del request entrante, que puede
    // no tener header Origin (navegaciones directas del browser no lo envían).
    fetchHeaders.set("Origin", FRONTEND_ORIGIN);

    const userAgent = request.headers.get("User-Agent");
    if (userAgent) fetchHeaders.set("User-Agent", userAgent);

    const response = await fetch(`${API_BASE}/auth/get-session`, {
      method: "GET",
      headers: fetchHeaders,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { valid: false, reason: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();

    if (data?.session && data?.user) {
      return { valid: true, user: data.user };
    }

    return { valid: false, reason: "La respuesta de la API no contiene datos de sesión." };
  } catch (error) {
    logger.error("[Middleware] Error validando sesión:", error);
    return {
      valid: false,
      reason: `Error de red interna (fetch falló): ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;
  const pathname = url.pathname;

  if (isIgnoredRoute(pathname)) {
    return next();
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const hasSessionCookie =
    cookieHeader.includes("better-auth.session_token") ||
    cookieHeader.includes("__Secure-better-auth.session_token");

  if (isPublicRoute(pathname)) {
    if (hasSessionCookie) {
      const { valid } = await validateSession(request, cookieHeader);
      if (valid) {
        return redirect("/", 302);
      }
    }
    return next();
  }

  if (!hasSessionCookie) {
    Sentry.captureMessage("Falta cookie de sesión en ruta protegida", {
      level: "warning",
      extra: {
        pathname,
        headers: cookieHeader || "Ninguna cookie recibida",
      },
    });
    return redirect("/login", 302);
  }

  const { valid, user, reason } = await validateSession(request, cookieHeader);
  if (!valid) {
    Sentry.captureMessage("Sesión rechazada por el backend en middleware", {
      level: "error",
      extra: {
        pathname,
        motivo_del_rechazo: reason || "Motivo desconocido",
      },
    });
    return redirect("/login", 302);
  }

  if (user && typeof user.email === "string") {
    Sentry.setUser({ email: user.email, id: String(user.id || "") });
  }

  return next();
});
