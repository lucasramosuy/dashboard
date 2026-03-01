import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { createToken, JWT_SECRET, hashPassword, verifyPassword } from "../lib/auth";
import type { UserRecord } from "../types/internal";
import { randomUUID } from "node:crypto";

const authRouter = new Hono();

const DEV_LOGIN_ENABLED = Bun.env.DEV_LOGIN_ENABLED === "true"; // Nunca activar en producción
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo123";

// POST /api/auth/login
authRouter.post("/login", async (c) => {
  // 1. Validar body
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ error: "email and password are required" }, 400);
  }
  const email = String(body.email).toLowerCase().trim();
  const password = body.password;

  let user = await dbService.users.getByEmail(email);

  // 2. Auto-crear usuario demo (DEV ONLY)
  if (DEV_LOGIN_ENABLED && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    if (!user) {
      const demoUser: UserRecord = {
        id: randomUUID(),
        email: DEMO_EMAIL,
        name: "Demo User",
        passwordHash: await hashPassword(DEMO_PASSWORD), // ✅ hasheado
        role: "admin",
      };
      await dbService.users.create(demoUser);
      user = await dbService.users.getByEmail(DEMO_EMAIL);
    }
  }

  // 3. Verificar credenciales
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: "Credenciales incorrectas" }, 401);
  }

  // 4. Emitir JWT
  const token = await createToken({
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  });

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// POST /api/auth/register
authRouter.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password || !body?.inviteCode) {
    return c.json(
      { error: "Nombre, email, contraseña y código de invitación son requeridos" },
      400,
    );
  }

  const { name, email, password, inviteCode } = body;
  const lowerEmail = String(email).toLowerCase().trim();

  // 1. Validar invite
  const invite = await dbService.invites.getByCode(inviteCode);
  if (!invite || invite.used) {
    return c.json({ error: "El código de invitación es inválido o ha sido usado" }, 403);
  }

  // 2. Verificar si el email ya existe
  const existingUser = await dbService.users.getByEmail(lowerEmail);
  if (existingUser) {
    return c.json({ error: "El email ya esta en uso" }, 409);
  }

  // 3. Crear usuario
  const newUser: UserRecord = {
    id: randomUUID(),
    name,
    email: lowerEmail,
    passwordHash: await hashPassword(password),
    role: "user",
  };

  try {
    await dbService.users.create(newUser);
    // 4. Marcar invite como usado
    await dbService.invites.markUsed(invite.id);
  } catch (err) {
    console.error("Registration error:", err);
    return c.json({ error: "Error al crear el usuario" }, 500);
  }

  // 5. Login automático (emitir JWT)
  const token = await createToken({
    id: newUser.id,
    email: newUser.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  });

  return c.json(
    {
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    },
    201,
  );
});

// GET /api/auth/me
authRouter.get("/me", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  const payload = c.get("jwtPayload");
  const user = await dbService.users.getById(payload.id);

  if (!user) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return c.json(safeUser);
});

// POST /api/auth/logout
authRouter.post("/logout", (c) => {
  return c.json({ status: "Desconectado exitosamente" });
});

export { authRouter };
