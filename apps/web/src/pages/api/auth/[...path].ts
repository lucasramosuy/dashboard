/**
 * Proxy SSR para Better Auth
 *
 * En prod el frontend (dashboard.lucasramos.uy) y la API (api.lucasramos.uy)
 * son dominios distintos. Browsers modernos bloquean cookies third-party incluso
 * con SameSite=None. Este proxy reenvía todas las peticiones de /api/auth/* al
 * backend real y devuelve la respuesta (con cookies) desde el propio dominio del
 * frontend, evitando el problema de cross-site cookies.
 *
 * Flujo:
 *   Browser → dashboard.lucasramos.uy/api/auth/sign-in/email
 *           → (SSR proxy) → api.lucasramos.uy/api/auth/sign-in/email
 *           ← Set-Cookie: __Secure-better-auth.session_token (domain=dashboard.lucasramos.uy)
 *
 * En dev: Vite proxy (/api → localhost:8787) maneja esto automáticamente.
 * Este archivo solo se usa en el build de producción (output: "server").
 */

import type { APIRoute } from "astro";

const API_BASE =
  import.meta.env.PUBLIC_API_BASE?.trim() || "http://localhost:8787/api";

// URL base del backend (sin /api al final, ya que path incluye /auth/...)
const UPSTREAM = API_BASE.replace(/\/api$/, "");

export const ALL: APIRoute = async ({ request, params }) => {
  const path = params.path ?? "";
  const upstreamUrl = new URL(
    `/api/auth/${path}`,
    UPSTREAM,
  );

  // Preservar query string
  const originalUrl = new URL(request.url);
  originalUrl.searchParams.forEach((v, k) => {
    upstreamUrl.searchParams.set(k, v);
  });

  // Copiar headers del request original al upstream
  const upstreamHeaders = new Headers(request.headers);
  // Sobreescribir Host con el del backend
  upstreamHeaders.set("host", upstreamUrl.host);
  // Forzar Origin al frontend para que Better Auth lo acepte en trustedOrigins
  const frontendOrigin =
    import.meta.env.PUBLIC_FRONTEND_ORIGIN?.trim() ||
    "http://localhost:4321";
  upstreamHeaders.set("origin", frontendOrigin);

  // Hacer el fetch al backend
  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers: upstreamHeaders,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined,
  });

  // Copiar headers de respuesta del upstream al cliente
  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      // Reescribir Domain y bajar SameSite a Lax: el cookie ahora es same-site
      const rewritten = value
        .replace(/Domain=\.lucasramos\.uy/gi, "Domain=dashboard.lucasramos.uy")
        .replace(/SameSite=None/gi, "SameSite=Lax");
      responseHeaders.append(key, rewritten);
    } else if (
      key.toLowerCase() !== "transfer-encoding" &&
      key.toLowerCase() !== "content-encoding"
    ) {
      responseHeaders.append(key, value);
    }
  });

  const body = await upstreamResponse.arrayBuffer();

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};
