import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/astro"; // ✅ Importación de Sentry

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
 * Reenvía la cookie original y los headers del cliente para que el backend la reconozca.
 */
async function validateSession(
  request: Request, // ✅ Ahora recibimos el objeto Request completo
  cookieHeader: string,
): Promise<{ valid: boolean; user?: Record<string, unknown> }> {
  const API_BASE =
    import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
      ? import.meta.env.PUBLIC_API_BASE
      : "http://localhost:8787/api";

  try {
    // ✅ Preparamos los headers para el backend incluyendo la cookie y la identidad del cliente
    const fetchHeaders = new Headers();
    fetchHeaders.set("Cookie", cookieHeader);

    // Reenviamos el User-Agent para pasar la validación anti-robo de sesión de Better Auth
    const userAgent = request.headers.get("User-Agent");
    if (userAgent) fetchHeaders.set("User-Agent", userAgent);

    // Reenviamos el Origin para pasar la protección CSRF
    const origin = request.headers.get("Origin") || new URL(request.url).origin;
    fetchHeaders.set("Origin", origin);

    // Reenviamos la IP original si existe (buena práctica para logs de auth)
    const forwardedFor = request.headers.get("X-Forwarded-For");
    if (forwardedFor) fetchHeaders.set("X-Forwarded-For", forwardedFor);

    const response = await fetch(`${API_BASE}/auth/get-session`, {
      method: "GET",
      headers: fetchHeaders, // Enviamos los headers enriquecidos
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
    console.error("[Middleware] Error validando sesión:", error);
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
  const hasSessionCookie =
    cookieHeader.includes("better-auth.session_token") ||
    cookieHeader.includes("__Secure-better-auth.session_token");

  // 3. Ruta pública (login)
  if (isPublicRoute(pathname)) {
    // Si el usuario ya tiene sesión válida, redirigir al dashboard
    if (hasSessionCookie) {
      // ✅ Pasamos 'request' como primer argumento
      const { valid } = await validateSession(request, cookieHeader);
      if (valid) {
        return redirect("/", 302);
      }
    }
    return next();
  }

  // 4. Ruta protegida — verificar autenticación
  if (!hasSessionCookie) {
    // ✅ Reportamos a Sentry que Astro no recibió la cookie del navegador
    Sentry.captureMessage("Falta cookie de sesión en ruta protegida", {
      level: "warning",
      extra: {
        pathname,
        headers: cookieHeader || "Ninguna cookie recibida",
      },
    });
    return redirect("/login", 302);
  }

  // ✅ Pasamos 'request' como primer argumento para extraer el user-agent y origin
  const { valid, user } = await validateSession(request, cookieHeader);
  if (!valid) {
    // ✅ Reportamos a Sentry que la cookie existe, pero Hono la rechazó
    Sentry.captureMessage("Sesión rechazada por el backend en middleware", {
      level: "error",
      extra: {
        pathname,
        cookieHeader: "Cookie presente pero no validada por el backend",
      },
    });
    return redirect("/login", 302);
  }

  // 5. Sesión válida — continuar
  // ✅ Configuramos el usuario en Sentry para que cualquier error futuro en esta página esté asociado a él
  if (user && typeof user.email === "string") {
    Sentry.setUser({ email: user.email, id: String(user.id || "") });
  }

  return next();
});
