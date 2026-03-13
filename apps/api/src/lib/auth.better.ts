import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { createClient } from "@libsql/client";
import { getDbConfig } from "./db";

// En el entorno de tests necesitamos pasar explícitamente la config para SQLite local
const libsqlClient = createClient(getDbConfig());

// Kysely con dialecto libsql — funciona con Turso, SQLite local e in-memory (tests)
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect({
    client: libsqlClient as any, // Bypass TS2322 version mismatch error
  }),
});

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: {
    db: kyselyDb,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
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

  advanced: {
    crossSubDomainCookies: {
      enabled: isProd,
      domain: isProd ? ".lucasramos.uy" : undefined,
    },
    // Con crossSubDomainCookies el browser necesita SameSite=None; Secure para
    // aceptar la cookie en requests cross-subdomain (dashboard. → api.).
    // Better Auth usa Lax por defecto, lo que bloquea la cookie en prod.
    defaultCookieAttributes: isProd
      ? { sameSite: "none", secure: true }
      : {},
  },
});
