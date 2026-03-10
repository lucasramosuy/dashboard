import { defineMiddleware } from "astro:middleware";
import { logger } from "./lib/logger";

/**
 * Rutas públicas que NO requieren autenticación.
 * Todo lo demás es protegido por defecto.
 */
const PUBLIC_ROUTES = ["/login"];

/**
 * Prefijos que se ignoran (assets, API proxy, Astro internals).
 */
const IGNORED_PREFIXES = ["/api", "/_", "/_image"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function isIgnoredRoute(pathname: string): boolean {
  return IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Valida la sesión de Better Auth contra el backend.
 * Reenvía la cookie original para que el backend la reconozca.
 */
async function validateSession(
  cookieHeader: string,
): Promise<{ valid: boolean; user?: Record<string, unknown> }> {
  const API_BASE =
    import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
      ? import.meta.env.PUBLIC_API_BASE
      : "http://localhost:8787/api";

  try {
    const response = await fetch(`${API_BASE}/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();

    // Better Auth devuelve { session, user } si la sesión es válida
    if (data?.session && data?.user) {
      return { valid: true, user: data.user };
    }

    return { valid: false };
  } catch (error) {
    logger.error("[Middleware] Error validando sesión:", error);
    return { valid: false };
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;
  const pathname = url.pathname;

  // 1. Ignorar rutas internas, assets y API proxy
  if (isIgnoredRoute(pathname)) {
    return next();
  }

  // 2. Extraer cookies del request
  const cookieHeader = request.headers.get("Cookie") || "";
  const hasSessionCookie = cookieHeader.includes("better-auth.session_token");

  // 3. Ruta pública (login)
  if (isPublicRoute(pathname)) {
    // Si el usuario ya tiene sesión válida, redirigir al dashboard
    if (hasSessionCookie) {
      const { valid } = await validateSession(cookieHeader);
      if (valid) {
        return redirect("/", 302);
      }
    }
    return next();
  }

  // 4. Ruta protegida — verificar autenticación
  if (!hasSessionCookie) {
    return redirect("/login", 302);
  }

  const { valid } = await validateSession(cookieHeader);
  if (!valid) {
    return redirect("/login", 302);
  }

  // 5. Sesión válida — continuar
  return next();
});
