import { Hono } from "hono";
import type { Context, Next } from "hono";
import { db, dbService } from "../lib/db";
import { hashPassword, isLegacyHash } from "../lib/password";
import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import { listAdminLog, logAdminAction, type AdminAction } from "../lib/admin-log";

// Panel de administración (/dashboard/admin). Solo para los emails de ADMIN_EMAILS
// (secret del Worker, separados por coma). Todo lo sensible (códigos de invitación,
// contraseñas temporales) se ve solo en pantalla: nada pasa por logs.

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isAdminEmail = (email: string) => adminEmails().includes(email.toLowerCase());

const adminOnly = async (c: Context<AuthEnv>, next: Next) => {
  if (!isAdminEmail(c.get("user").email)) return c.json({ error: "Forbidden" }, 403);
  await next();
};

// Sin caracteres ambiguos (0/O, 1/l/I) para que se pueda dictar o copiar a mano.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export function randomToken(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const log = (c: Context<AuthEnv>, action: AdminAction, target?: string | null) =>
  logAdminAction({
    actorId: c.get("user").id,
    actorEmail: c.get("user").email,
    action,
    target,
    ip: c.req.header("cf-connecting-ip") ?? null,
  });

const adminRouter = new Hono<AuthEnv>();
adminRouter.use("*", authMiddleware);

// GET /api/admin/me: la web lo usa para mostrar u ocultar el acceso al panel
adminRouter.get("/me", (c) => c.json({ admin: isAdminEmail(c.get("user").email) }));

adminRouter.use("*", adminOnly);

// GET /api/admin/users
adminRouter.get("/users", async (c) => {
  const me = c.get("user").id;
  const r = await db.execute(
    `SELECT u.id, u.name, u.email, u.createdAt, a.password AS hash,
            (SELECT MAX(s.updatedAt) FROM session s WHERE s.userId = u.id) AS lastSeen
       FROM user u
       LEFT JOIN account a ON a.userId = u.id AND a.providerId = 'credential'
      ORDER BY u.createdAt ASC`,
  );
  return c.json(
    r.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      createdAt: row.createdAt as string,
      lastSeen: (row.lastSeen as string | null) ?? null,
      hasPassword: Boolean(row.hash),
      legacyHash: row.hash ? isLegacyHash(row.hash as string) : false,
      admin: isAdminEmail(row.email as string),
      self: row.id === me,
    })),
  );
});

// POST /api/admin/users/:id/reset-password
// Genera una contraseña temporal, la guarda en PBKDF2 y cierra las sesiones de ese usuario.
// La contraseña se devuelve una sola vez; el usuario la cambia desde su perfil.
adminRouter.post("/users/:id/reset-password", async (c) => {
  const userId = c.req.param("id");
  // La propia cuenta no: el reset cierra todas las sesiones (incluida la actual) y la
  // temporal se pierde al salir. Para eso está "Cambiar contraseña" en Mi Perfil.
  if (userId === c.get("user").id) {
    return c.json({ error: "Para tu cuenta usá Cambiar contraseña en Mi Perfil" }, 400);
  }
  const password = randomToken(12);
  const res = await db.execute({
    sql: "UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'",
    args: [await hashPassword(password), new Date().toISOString(), userId],
  });
  if (res.rowsAffected === 0) return c.json({ error: "Usuario sin contraseña o inexistente" }, 404);
  await db.execute({ sql: "DELETE FROM session WHERE userId = ?", args: [userId] });
  const target = await db.execute({ sql: "SELECT email FROM user WHERE id = ?", args: [userId] });
  await log(c, "reset_password", (target.rows[0]?.email as string | undefined) ?? userId);
  return c.json({ password });
});

// GET /api/admin/invites: los que siguen sin usar
adminRouter.get("/invites", async (c) => {
  const r = await db.execute(
    "SELECT id, code, created_at FROM invites WHERE used = 0 ORDER BY created_at DESC",
  );
  return c.json(
    r.rows.map((row) => ({
      id: row.id as string,
      code: row.code as string,
      createdAt: row.created_at as string,
    })),
  );
});

// POST /api/admin/invites: crea un código de un solo uso
adminRouter.post("/invites", async (c) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const invite = {
      id: crypto.randomUUID(),
      code: randomToken(8).toUpperCase(),
      used: false,
      created_at: new Date(),
    };
    try {
      await dbService.invites.create(invite);
      await log(c, "invite_create");
      return c.json(
        { id: invite.id, code: invite.code, createdAt: invite.created_at.toISOString() },
        201,
      );
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("UNIQUE"))) throw err;
    }
  }
  return c.json({ error: "No se pudo generar un código único" }, 500);
});

// DELETE /api/admin/invites/:id: anula un código sin usar
adminRouter.delete("/invites/:id", async (c) => {
  const res = await db.execute({
    sql: "DELETE FROM invites WHERE id = ? AND used = 0",
    args: [c.req.param("id")],
  });
  if (res.rowsAffected === 0) return c.json({ error: "Not found" }, 404);
  await log(c, "invite_delete");
  return c.json({ success: true });
});

// GET /api/admin/log: últimas acciones del panel (quién, qué, cuándo)
adminRouter.get("/log", async (c) => {
  const limit = Number(c.req.query("limit") ?? 50) || 50;
  return c.json(await listAdminLog(limit));
});

export { adminRouter };
