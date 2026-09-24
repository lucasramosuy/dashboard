import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { db } from "./db";
import { hashPassword, verifyPassword } from "./password";

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
  trustedOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:4321"],

  // Web y API comparten origen (lucasramos.uy/dashboard), así que alcanzan las cookies
  // por defecto de Better Auth (SameSite=Lax, Secure en https). Ya no hacen falta
  // cookies cross-subdomain.
});
