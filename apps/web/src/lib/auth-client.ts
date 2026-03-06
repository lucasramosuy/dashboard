import { createAuthClient } from "better-auth/react";

// Better Auth necesita URL completa con protocolo.
// En dev, usamos window.location.origin para que pase por el proxy de Astro (localhost:4321).
// En prod, PUBLIC_API_BASE apunta al backend real.
const API_BASE =
  import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
    ? import.meta.env.PUBLIC_API_BASE
    : typeof window !== "undefined"
      ? window.location.origin + "/api"
      : "http://localhost:4321/api";

// Better Auth necesita URL completa con protocolo.
// Si le pasas /api, Better Auth por defecto trataría de añadir /api/auth.
// Pero si en tu entorno ya es https://api.lucasramos.uy/api, asume que esa base es de auth.
// Solución segura: Pasar explícitamente la base donde reside auth (API_BASE + /auth)
const baseURL = `${API_BASE}/auth`;

export const authClient = createAuthClient({
  baseURL,
});
