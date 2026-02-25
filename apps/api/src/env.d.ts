/* eslint-disable */
declare module "bun" {
  interface Env {
    JWT_SECRET: string;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_PATH?: string;
    DEV_LOGIN_ENABLED?: string;
  }
}
