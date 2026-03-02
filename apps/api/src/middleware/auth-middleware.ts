import type { Context, Next } from "hono";
import { auth } from "../lib/auth.better";

/**
 * Tipo para las variables de contexto de Hono con sesión autenticada.
 * Elimina `any` en favor de tipos explícitos derivados de Better Auth.
 */
export type AuthEnv = {
  Variables: {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    session: {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
    };
  };
};

/**
 * Middleware de autenticación compartido.
 * Verifica la sesión vía Better Auth y setea `user` y `session` en el contexto.
 */
export const authMiddleware = async (c: Context<AuthEnv>, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user as AuthEnv["Variables"]["user"]);
  c.set("session", session.session as AuthEnv["Variables"]["session"]);
  await next();
};
