import { createAuthClient } from "better-auth/react";

// En dev: el proxy de Astro/Vite reenvía /api → localhost:8787,
// por lo que usamos una ruta relativa a localhost:4321.
// En prod: PUBLIC_API_BASE apunta al backend real (ej: https://api.lucasramos.uy/api).
//
// IMPORTANTE: baseURL debe ser una URL absoluta con protocolo.
// En SSR (sin window), siempre apuntamos a localhost:4321 que es donde corre Astro.
const PUBLIC_API_BASE = import.meta.env.PUBLIC_API_BASE?.trim();

const baseURL = PUBLIC_API_BASE
  ? `${PUBLIC_API_BASE}/auth`
  : "http://localhost:4321/api/auth";

export const authClient = createAuthClient({
  baseURL,
});
