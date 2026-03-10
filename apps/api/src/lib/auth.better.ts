import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const getDbConfig = () => {
  if (Bun.env.NODE_ENV === "test") {
    return { url: "file:./data/test.sqlite" };
  }

  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    };
  }

  // CORRECCIÓN: Para desarrollo local, usa dev.sqlite
  const dbPath = process.env.DATABASE_PATH ?? "data/dev.sqlite";
  return { url: `file:${dbPath}` };
};

const kyselyDb = new Kysely({
  dialect: new LibsqlDialect(getDbConfig()),
});

export const auth = betterAuth({
  secret: Bun.env.BETTER_AUTH_SECRET,
  baseURL: Bun.env.BETTER_AUTH_URL,
  database: {
    db: kyselyDb,
    type: "sqlite"
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
});
