import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { passkey } from "@better-auth/passkey";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { db } from "./db";
import { hashPassword, isLegacyHash, verifyPassword } from "./password";
import { PASSKEY_MUTATION_PATHS, checkAdminPasskey, markSessionPasskey } from "./admin-passkey";

// Kysely con dialecto libsql — funciona con Turso, SQLite local e in-memory (tests)
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect({
    client: db as any, // Bypass TS2322 version mismatch error
  }),
});

// La passkey queda atada al dominio de BETTER_AUTH_URL (lucasramos.uy en prod,
// el workers.dev en el preview, localhost en local).
const authUrl = new URL(process.env.BETTER_AUTH_URL || "http://localhost:4321");

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
  plugins: [
    passkey({
      rpID: authUrl.hostname,
      rpName: "Dashboard",
      origin: authUrl.origin,
    }),
  ],
  hooks: {
    // Passkeys: solo admins, y si ya tienen una, cambiarlas exige sesión con passkey
    before: createAuthMiddleware(async (ctx) => {
      if (!PASSKEY_MUTATION_PATHS.has(ctx.path)) return;
      const current = await getSessionFromCtx(ctx);
      if (!current) throw new APIError("UNAUTHORIZED");
      const gate = await checkAdminPasskey(current.user, current.session.id);
      if (gate === "not-admin") {
        throw new APIError("FORBIDDEN", { message: "Las passkeys son solo para administración" });
      }
      if (gate === "passkey-required") {
        throw new APIError("FORBIDDEN", {
          message: "Entrá con tu passkey para cambiar las passkeys",
          code: "PASSKEY_REQUIRED",
        });
      }
    }),
    // Rehash al entrar: si la contraseña todavía está en scrypt (formato viejo), después
    // de un login correcto se vuelve a guardar en PBKDF2. Así nadie tiene que resetearla
    // y el próximo login ya entra en el límite de CPU de Workers.
    after: createAuthMiddleware(async (ctx) => {
      // Sesión iniciada con passkey: queda marcada para abrir el panel de admin
      if (ctx.path === "/passkey/verify-authentication") {
        const sessionId = ctx.context.newSession?.session.id;
        if (sessionId) await markSessionPasskey(sessionId);
        return;
      }
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
