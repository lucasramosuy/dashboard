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
    return c.json({ error: "Invalid credentials" }, 401);
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

// GET /api/auth/me
authRouter.get("/me", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  const payload = c.get("jwtPayload");
  const user = await dbService.users.getById(payload.id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return c.json(safeUser);
});

// POST /api/auth/logout
authRouter.post("/logout", (c) => {
  return c.json({ status: "logged out" });
});

export { authRouter };
