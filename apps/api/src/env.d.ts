declare module "bun" {
  interface Env {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_PATH?: string;
    TURSO_DATABASE_URL?: string;
    TURSO_AUTH_TOKEN?: string;
    BETTER_AUTH_URL?: string;
    CORS_ORIGINS?: string;
    DEV_LOGIN_ENABLED?: string;
  }
}
