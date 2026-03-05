import { createAuthClient } from "better-auth/react";

// Better Auth necesita URL completa con protocolo.
// En dev, usamos window.location.origin para que pase por el proxy de Astro (localhost:4321).
// En prod, PUBLIC_API_BASE apunta al backend real.
const baseURL =
  import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
    ? import.meta.env.PUBLIC_API_BASE
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:4321";

export const authClient = createAuthClient({
  baseURL,
});
