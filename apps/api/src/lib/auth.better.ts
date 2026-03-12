import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

// Misma lógica de resolución de config que db.ts — incluyendo soporte para test
const getDbConfig = () => {
  if (process.env.NODE_ENV === "test") {
    return { url: "file:./data/test.sqlite" };
  }
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    };
  }
  const dbPath = process.env.DATABASE_PATH ?? "./data/database.sqlite";
  return { url: `file:${dbPath}` };
};

import { createClient } from "@libsql/client";

// En el entorno de tests necesitamos pasar explícitamente la config para SQLite local
const libsqlClient = createClient(getDbConfig());

// Kysely con dialecto libsql — funciona con Turso, SQLite local e in-memory (tests)
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect({
    client: libsqlClient as any, // Bypass TS2322 version mismatch error
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
      enabled: true,
      domain: ".lucasramos.uy",
    },
  },
});
