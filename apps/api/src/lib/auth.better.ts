import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { db } from "./db";

// Kysely con dialecto libsql — funciona con Turso, SQLite local e in-memory (tests)
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect({
    client: db,
  }),
});

export const auth = betterAuth({
  secret: Bun.env.BETTER_AUTH_SECRET,
  baseURL: Bun.env.BETTER_AUTH_URL,
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
  trustedOrigins: Bun.env.CORS_ORIGINS
    ? Bun.env.CORS_ORIGINS.split(",")
    : ["http://localhost:4321"],
});
