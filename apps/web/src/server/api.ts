// Puente entre el Worker (o el middleware SSR) y la API de Hono.
// La web vive en /dashboard y la API en /dashboard/api: se saca el prefijo /dashboard
// y la app de Hono ve las mismas rutas /api/* que en el server de Bun.
import type { ExecutionContext } from "@cloudflare/workers-types";
import { app } from "../../../api/src/app";

const BASE = "/dashboard";

export function isApiPath(pathname: string) {
  return pathname === `${BASE}/api` || pathname.startsWith(`${BASE}/api/`);
}

export async function handleApi(
  request: Request,
  env?: unknown,
  ctx?: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.slice(BASE.length) + url.search;

  // Desarrollo local: si API_PROXY_URL está definido (p. ej. http://localhost:8787),
  // se reenvía al server de Bun, que usa la base SQLite local.
  const proxy = process.env.API_PROXY_URL;
  if (proxy) return fetch(new Request(proxy.replace(/\/$/, "") + path, request));

  return app.fetch(new Request(new URL(path, url.origin), request), env, ctx);
}
