import { sign, verify } from "hono/jwt";

export const JWT_SECRET = Bun.env.JWT_SECRET || "dev-secret-change-me";

// Renombrado a AppJWTPayload para no colisionar con el tipo de Hono
export interface AppJWTPayload {
  id: string;
  email: string;
  exp: number;
  [key: string]: unknown; // ← requerido por Hono para que los tipos sean compatibles
}

export async function createToken(payload: AppJWTPayload): Promise<string> {
  return await sign(payload, JWT_SECRET, "HS256");
}

export async function verifyToken(token: string): Promise<AppJWTPayload | null> {
  try {
    return await verify(token, JWT_SECRET, "HS256") as AppJWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}
