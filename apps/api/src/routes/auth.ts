import { Hono } from "hono";
import { dbService } from "../lib/db";
import { auth } from "../lib/auth.better";
import { registerSchema } from "@dashboard/shared-types";
import { logger } from "../lib/logger";

const authRouter = new Hono();

authRouter.post("/register", async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const lowerEmail = body.email.toLowerCase().trim();

  const invite = await dbService.invites.getByCode(body.inviteCode);
  if (!invite || invite.used) {
    return c.json({ error: "El código de invitación es inválido o ha sido usado" }, 403);
  }

  const existingUser = await dbService.users.getByEmail(lowerEmail);
  if (existingUser) {
    return c.json({ error: "El email ya está en uso" }, 409);
  }

  try {
    // Inyección del contexto HTTP y retorno como Response estándar
    const response = await auth.api.signUpEmail({
      body: {
        email: lowerEmail,
        password: body.password,
        name: body.name,
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });

    // Si Better Auth falla (ej. contraseña débil), retorna el error HTTP nativo
    if (!response.ok) {
      return response;
    }

    await dbService.invites.markUsed(invite.id);

    // Retorna el objeto Response de Better Auth que contiene el header Set-Cookie
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear el usuario";
    logger.error("[auth/register] Error al crear el usuario:", err);
    return c.json({ error: message }, 500);
  }
});

export { authRouter };
