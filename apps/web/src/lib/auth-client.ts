import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { url } from "./utils";

// Better Auth está en el mismo origen: /dashboard/api/auth
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? `${window.location.origin}${url("/api/auth")}` : undefined,
  plugins: [passkeyClient()],
});
