declare module "bun" {
  interface Env {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_PATH?: string;
    TURSO_DATABASE_URL?: string;
    TURSO_AUTH_TOKEN?: string;
    BETTER_AUTH_URL?: string;
    CORS_ORIGINS?: string;
    ADMIN_EMAILS?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
  }
}
