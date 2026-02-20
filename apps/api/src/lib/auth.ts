import { sign, verify } from "hono/jwt";

export const JWT_SECRET = process.env.JWT_SECRET || "dashboard-secret-change-me";

export async function createToken(payload: any) {
  return await sign(payload, JWT_SECRET, "HS256");
}

export async function verifyToken(token: string) {
  try {
    return await verify(token, JWT_SECRET, "HS256");
  } catch (e) {
    return null;
  }
}
