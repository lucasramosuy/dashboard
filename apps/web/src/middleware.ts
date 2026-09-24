import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/cloudflare";
import { url } from "./lib/utils";
import { handleApi } from "./server/api";

// Rutas relativas al base de Astro ("/dashboard")
const PUBLIC_ROUTES = ["/login"];
const IGNORED_PREFIXES = ["/api", "/_", "/_image"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function appPath(pathname: string): string {
  return (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname) || "/";
}

// Valida la sesión llamando a Better Auth en el mismo Worker (sin salir a la red).
async function validateSession(
  request: Request,
  cookieHeader: string,
): Promise<{ valid: boolean; user?: Record<string, unknown>; reason?: string }> {
  try {
    const origin = new URL(request.url).origin;
    const response = await handleApi(
      new Request(`${origin}${BASE}/api/auth/get-session`, {
        headers: { Cookie: cookieHeader, Accept: "application/json", Origin: origin },
      }),
    );

    if (!response.ok) {
      return { valid: false, reason: `HTTP ${response.status}: ${await response.text()}` };
    }

    const data = await response.json();
    if (data?.session && data?.user) {
      return { valid: true, user: data.user };
    }
    return { valid: false, reason: "Sin sesión" };
  } catch (error) {
    console.error("[Middleware] Error validando sesión:", error);
    return {
      valid: false,
      reason: `Error validando sesión: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect } = context;
  const pathname = appPath(context.url.pathname);

  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const hasSessionCookie =
    cookieHeader.includes("better-auth.session_token") ||
    cookieHeader.includes("__Secure-better-auth.session_token");

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (hasSessionCookie) {
      const { valid } = await validateSession(request, cookieHeader);
      if (valid) return redirect(url("/"), 302);
    }
    return next();
  }

  if (!hasSessionCookie) {
    return redirect(url("/login"), 302);
  }

  const { valid, user, reason } = await validateSession(request, cookieHeader);
  if (!valid) {
    Sentry.captureMessage("Sesión rechazada en middleware", {
      level: "warning",
      extra: { pathname, motivo_del_rechazo: reason || "Motivo desconocido" },
    });
    return redirect(url("/login"), 302);
  }

  if (user && typeof user.email === "string") {
    Sentry.setUser({ email: user.email, id: String(user.id || "") });
  }

  return next();
});
