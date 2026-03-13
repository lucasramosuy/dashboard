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

// La URL de la API: en dev apunta directamente al backend (bypaseando el proxy de Vite
// que no existe en SSR). En prod usa PUBLIC_API_BASE del build.
const API_BASE =
  import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
    ? import.meta.env.PUBLIC_API_BASE
    : "http://localhost:8787/api";

// El origen del frontend: en dev es localhost:4321 (en trustedOrigins de Better Auth),
// en prod es la variable de entorno PUBLIC_FRONTEND_ORIGIN.
const FRONTEND_ORIGIN =
  import.meta.env.PUBLIC_FRONTEND_ORIGIN && import.meta.env.PUBLIC_FRONTEND_ORIGIN.trim() !== ""
    ? import.meta.env.PUBLIC_FRONTEND_ORIGIN
    : "http://localhost:4321";

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
