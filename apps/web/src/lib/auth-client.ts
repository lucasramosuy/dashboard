import { createAuthClient } from "better-auth/react";

// Siempre usamos la ruta /api/auth relativa al frontend.
// - En dev: Vite proxy reenvía /api → localhost:8787
// - En prod: el endpoint SSR apps/web/src/pages/api/auth/[...path].ts
//   actúa como proxy hacia api.lucasramos.uy, seteando las cookies
//   desde el mismo dominio (dashboard.lucasramos.uy) para evitar
//   el bloqueo de third-party cookies en browsers modernos.
const baseURL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : `${import.meta.env.PUBLIC_FRONTEND_ORIGIN ?? "http://localhost:4321"}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
});
