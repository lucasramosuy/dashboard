import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";

const testEmail = `auth-test@example.com`;
const testPassword = "testpass123";
const testName = "Auth Test User";

// Helper: login and get session cookie
async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error("No set-cookie header in login response");
  return cookie;
}

describe("Backend API Tests (Auth - Better Auth)", () => {
  // Create test user before EACH test (setup.ts deletes all data between tests)
  beforeEach(async () => {
    await auth.api.signUpEmail({
      body: { email: testEmail, password: testPassword, name: testName },
    });
  });

  it("GET /api/health should return status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("POST /api/auth/sign-in/email should work with valid credentials", async () => {
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeTruthy();
  });

  it("POST /api/auth/sign-in/email should fail with invalid credentials", async () => {
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: "wrong-password" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("GET /api/auth/get-session should return null session without cookie", async () => {
    const res = await app.request("/api/auth/get-session");
    // Better Auth returns 200 with null body when no session cookie
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    // Body is null or has no user property when no session
    expect(body === null || !body.user).toBe(true);
  });

  it("GET /api/auth/get-session should return user info with valid session", async () => {
    const cookie = await loginAndGetCookie(testEmail, testPassword);

    const res = await app.request("/api/auth/get-session", {
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user.email).toBe(testEmail);
    expect(body.user.name).toBe(testName);
    expect(body.user).not.toHaveProperty("password");
  });

  it("POST /api/auth/sign-up/email should be blocked (registro solo con invite)", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({
        email: "intruso@example.com",
        password: "intruso123",
        name: "Intruso",
      }),
      headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
    });
    expect(res.status).toBe(403);

    // El usuario no se creó: no puede iniciar sesión
    const login = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "intruso@example.com", password: "intruso123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(login.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Rehash de contraseñas scrypt al entrar", () => {
  it("un login correcto con hash scrypt lo reemplaza por PBKDF2 y el siguiente login sigue andando", async () => {
    const { db } = await import("../src/lib/db");
    const { hashPassword: scryptHash } = await import("better-auth/crypto");
    const email = "rehash@example.com";
    const password = "clave-vieja-123";

    await auth.api.signUpEmail({ body: { email, password, name: "Rehash" } });
    const user = await db.execute({ sql: "SELECT id FROM user WHERE email = ?", args: [email] });
    const userId = user.rows[0].id as string;
    await db.execute({
      sql: "UPDATE account SET password = ? WHERE userId = ? AND providerId = 'credential'",
      args: [await scryptHash(password), userId],
    });

    const readHash = async () =>
      (
        await db.execute({
          sql: "SELECT password FROM account WHERE userId = ? AND providerId = 'credential'",
          args: [userId],
        })
      ).rows[0].password as string;

    expect((await readHash()).startsWith("pbkdf2$")).toBe(false);
    await loginAndGetCookie(email, password);
    expect((await readHash()).startsWith("pbkdf2$sha256$")).toBe(true);
    await loginAndGetCookie(email, password);
  });

  it("un login fallido no toca el hash", async () => {
    const { db } = await import("../src/lib/db");
    const { hashPassword: scryptHash } = await import("better-auth/crypto");
    const email = "rehash-fail@example.com";
    await auth.api.signUpEmail({ body: { email, password: "clave-vieja-123", name: "R" } });
    const legacy = await scryptHash("clave-vieja-123");
    await db.execute({
      sql: "UPDATE account SET password = ? WHERE providerId = 'credential' AND userId = (SELECT id FROM user WHERE email = ?)",
      args: [legacy, email],
    });
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email, password: "otra-clave-999" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const row = await db.execute({
      sql: "SELECT password FROM account WHERE providerId = 'credential' AND userId = (SELECT id FROM user WHERE email = ?)",
      args: [email],
    });
    expect(row.rows[0].password).toBe(legacy);
  });
});
