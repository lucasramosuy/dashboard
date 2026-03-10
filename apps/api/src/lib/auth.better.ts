import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const getDbConfig = () => {
  // Para los tests automatizados: usa un archivo temporal en la raíz de api/
  if (process.env.NODE_ENV === "test") {
    return { url: "file:test.sqlite" };
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
  secret: process.env.BETTER_AUTH_SECRET || "test-secret-key",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4321",
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
});
