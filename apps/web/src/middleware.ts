import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/astro";

const PUBLIC_ROUTES = ["/login"];
const IGNORED_PREFIXES = ["/api", "/_", "/_image"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function isIgnoredRoute(pathname: string): boolean {
  return IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ✅ Actualizamos para que devuelva la razón (reason) del fallo
async function validateSession(
  request: Request,
  cookieHeader: string,
): Promise<{ valid: boolean; user?: Record<string, unknown>; reason?: string }> {
  const API_BASE =
    import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
      ? import.meta.env.PUBLIC_API_BASE
      : "http://localhost:8787/api";

  try {
    const fetchHeaders = new Headers();
    fetchHeaders.set("Cookie", cookieHeader);

    // Agregamos Accept explícito para prevenir bloqueos del backend
    fetchHeaders.set("Accept", "application/json");

    const userAgent = request.headers.get("User-Agent");
    if (userAgent) fetchHeaders.set("User-Agent", userAgent);

    const origin = request.headers.get("Origin") || new URL(request.url).origin;
    fetchHeaders.set("Origin", origin);

    const forwardedFor = request.headers.get("X-Forwarded-For");
    if (forwardedFor) fetchHeaders.set("X-Forwarded-For", forwardedFor);

    const response = await fetch(`${API_BASE}/auth/get-session`, {
      method: "GET",
      headers: fetchHeaders,
    });

    if (!response.ok) {
      // ✅ Si Hono rechaza, leemos exactamente qué nos contestó (Ej: HTTP 403 Forbidden)
      const errorText = await response.text();
      return { valid: false, reason: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();

    if (data?.session && data?.user) {
      return { valid: true, user: data.user };
    }

    return { valid: false, reason: "La respuesta de la API no contiene datos de sesión." };
  } catch (error) {
    console.error("[Middleware] Error validando sesión:", error);
    // ✅ Si es un error de DNS o de red (fetch failed), lo capturamos
    return {
      valid: false,
      reason: `Error de red interna (fetch falló): ${error instanceof Error ? error.message : String(error)}`
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

  // ✅ Ahora capturamos el reason y lo inyectamos en Sentry
  const { valid, user, reason } = await validateSession(request, cookieHeader);
  if (!valid) {
    Sentry.captureMessage("Sesión rechazada por el backend en middleware", {
      level: "error",
      extra: {
        pathname,
        motivo_del_rechazo: reason || "Motivo desconocido", // <- ¡AQUÍ ESTÁ LA MAGIA!
      },
    });
    return redirect("/login", 302);
  }

  if (user && typeof user.email === "string") {
    Sentry.setUser({ email: user.email, id: String(user.id || "") });
  }

  return next();
});
