import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { db } from "./db";
import { hashPassword, isLegacyHash, verifyPassword } from "./password";

// Kysely con dialecto libsql — funciona con Turso, SQLite local e in-memory (tests)
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect({
    client: db as any, // Bypass TS2322 version mismatch error
  }),
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: {
    db: kyselyDb,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    // PBKDF2 en vez de scrypt para entrar en el límite de CPU de Workers (ver lib/password.ts)
    password: { hash: hashPassword, verify: verifyPassword },
  },
  user: {
    additionalFields: {
      ical_url: { type: "string", required: false },
      last_ical_sync: { type: "date", required: false },
    },
  },
  hooks: {
    // Rehash al entrar: si la contraseña todavía está en scrypt (formato viejo), después
    // de un login correcto se vuelve a guardar en PBKDF2. Así nadie tiene que resetearla
    // y el próximo login ya entra en el límite de CPU de Workers.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const userId = ctx.context.newSession?.user.id;
      const password = (ctx.body as { password?: unknown } | undefined)?.password;
      if (!userId || typeof password !== "string") return;
      await rehashIfLegacy(userId, password);
    }),
  },
  // Rate limit guardado en la base (tabla rateLimit): en Workers la memoria es por
  // instancia y el límite en memoria casi no frenaba nada. Solo en producción.
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  advanced: {
    // Detrás de Cloudflare la IP real del visitante viene en este header
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
  },
  trustedOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:4321"],

  // Web y API comparten origen (lucasramos.uy/dashboard), así que alcanzan las cookies
  // por defecto de Better Auth (SameSite=Lax, Secure en https). Ya no hacen falta
  // cookies cross-subdomain.
});

// Reemplaza un hash scrypt por uno PBKDF2. Nunca corta el login: si falla, lo loguea y sigue.
export async function rehashIfLegacy(userId: string, password: string) {
  try {
    const row = await db.execute({
      sql: "SELECT id, password FROM account WHERE userId = ? AND providerId = 'credential'",
      args: [userId],
    });
    const account = row.rows[0];
    const current = account?.password as string | undefined;
    if (!account || !current || !isLegacyHash(current)) return;
    await db.execute({
      sql: "UPDATE account SET password = ?, updatedAt = ? WHERE id = ?",
      args: [await hashPassword(password), new Date().toISOString(), account.id as string],
    });
  } catch (err) {
    console.error("[auth] No se pudo migrar el hash a PBKDF2:", err);
  }
}
