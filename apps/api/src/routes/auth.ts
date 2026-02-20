import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { readJson, writeJson } from "../lib/db";
import { createToken, JWT_SECRET } from "../lib/auth";
import type { User } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const authRouter = new Hono();

// Configuration from env
const DEV_LOGIN_ENABLED = process.env.DEV_LOGIN_ENABLED === "true";
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo123";

// Login endpoint
authRouter.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const users = await readJson<User[]>("users.json");

  let user = users.find((u) => u.email === email);

  // DEV_LOGIN_ENABLED logic: Auto-create demo user if missing
  if (DEV_LOGIN_ENABLED && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    if (!user) {
      user = {
        id: randomUUID(),
        email: DEMO_EMAIL,
        name: "Demo User",
        passwordHash: DEMO_PASSWORD, // DEV ONLY: Plain text shortcut
        role: "admin",
      };
      users.push(user);
      await writeJson("users.json", users);
    }
  }

  // Password verification (DEV ONLY: simple equality)
  if (!user || user.passwordHash !== password) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Sign JWT (Payload: user id and email)
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

// Me endpoint (Requires JWT)
authRouter.get("/me", jwt({ secret: JWT_SECRET, alg: "HS256" }), async (c) => {
  const payload = c.get("jwtPayload");
  const users = await readJson<User[]>("users.json");
  const user = users.find((u) => u.id === payload.id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Return user without passwordHash
  const { passwordHash, ...safeUser } = user;
  return c.json(safeUser);
});

// Logout endpoint (Client-side token removal, this is just for completion)
authRouter.post("/logout", (c) => {
  return c.json({ status: "logged out" });
});

export { authRouter };
