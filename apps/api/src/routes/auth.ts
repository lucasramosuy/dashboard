import { Hono } from "hono";
import { dbService } from "../lib/db";
import { auth } from "../lib/auth.better";
import { registerSchema } from "@dashboard/shared-types";
import { logger } from "../lib/logger";

const authRouter = new Hono();

// POST /api/auth/register
// Valida invite code, luego crea usuario via Better Auth server-side API.
authRouter.post("/register", async (c) => {
  const body = registerSchema.parse(await c.req.json());

  const lowerEmail = body.email.toLowerCase().trim();

  // 1. Validar invite
  const invite = await dbService.invites.getByCode(body.inviteCode);
  if (!invite || invite.used) {
    return c.json({ error: "El código de invitación es inválido o ha sido usado" }, 403);
  }

  // 2. Verificar si el email ya existe
  const existingUser = await dbService.users.getByEmail(lowerEmail);
  if (existingUser) {
    return c.json({ error: "El email ya está en uso" }, 409);
  }

  // 3. Crear usuario via Better Auth server-side API
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: lowerEmail,
        password: body.password,
        name: body.name,
      },
    });

    // 4. Marcar invite como usado
    await dbService.invites.markUsed(invite.id);

    return c.json({ user: result.user }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear el usuario";
    logger.error("[auth/register] Error al crear el usuario:", err);
    return c.json({ error: message }, 500);
  }
});

export { authRouter };
