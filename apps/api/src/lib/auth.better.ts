import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const getDbConfig = () => {
  if (Bun.env.NODE_ENV === "test") {
    return { url: "file:test.sqlite" };
  }
  if (Bun.env.TURSO_DATABASE_URL) {
    return {
      url: Bun.env.TURSO_DATABASE_URL,
      authToken: Bun.env.TURSO_AUTH_TOKEN ?? "",
    };
  }
  const dbPath = Bun.env.DATABASE_PATH ?? "database.sqlite";
  return { url: `file:${dbPath}` };
};

// Restaurar la instancia de Kysely
const kyselyDb = new Kysely({
  dialect: new LibsqlDialect(getDbConfig()),
});

export const auth = betterAuth({
  secret: Bun.env.BETTER_AUTH_SECRET,
  baseURL: Bun.env.BETTER_AUTH_URL,
  database: {
    db: kyselyDb, // Inyección estricta de la instancia
    type: "sqlite", // Declaración explícita del motor
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
