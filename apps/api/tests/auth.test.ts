import { describe, it, expect } from "bun:test";
import { app } from "../src/server";

describe("Backend API Tests (Auth)", () => {
  it("GET /api/health should return status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("POST /api/auth/login should work with demo credentials in dev mode", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "demo123" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("token");
    expect(body.user.email).toBe("demo@example.com");
  });

  it("POST /api/auth/login should fail with invalid credentials", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "wrong-password" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login should fail with missing fields", async () => {
    // ← nuevo
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com" }), // sin password
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
  });

  it("GET /api/auth/me should return 401 without token", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me should return user info with valid token", async () => {
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "demo123" }),
      headers: { "Content-Type": "application/json" },
    });
    const { token } = (await loginRes.json()) as any;

    const meRes = await app.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(meRes.status).toBe(200);
    const user = (await meRes.json()) as any;
    expect(user.email).toBe("demo@example.com");
  });

  it("GET /api/auth/me should NOT expose passwordHash", async () => {
    // ← nuevo
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "demo123" }),
      headers: { "Content-Type": "application/json" },
    });
    const { token } = (await loginRes.json()) as any;

    const meRes = await app.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = (await meRes.json()) as any;
    expect(user).not.toHaveProperty("passwordHash"); // 🔴 seguridad crítica
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("name");
  });
});
