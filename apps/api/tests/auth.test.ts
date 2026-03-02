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
});
