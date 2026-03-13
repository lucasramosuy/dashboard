import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth`
      : (import.meta.env.PUBLIC_API_BASE as string | undefined) ??
        "https://api.lucasramos.uy/api",
});
