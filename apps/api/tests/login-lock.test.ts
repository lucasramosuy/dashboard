import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import { MAX_FAILURES, lockedMinutes, recordFailure } from "../src/lib/login-lock";

const email = "lock-test@example.com";
const password = "testpass123";

const login = (pass: string, mail = email) =>
  app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email: mail, password: pass }),
    headers: { "Content-Type": "application/json" },
  });

describe("bloqueo por cuenta", () => {
  beforeEach(async () => {
    await auth.api.signUpEmail({ body: { email, password, name: "Lock Test" } });
  });

  it("bloquea después de los intentos fallidos, incluso con la clave correcta", async () => {
    for (let i = 0; i < MAX_FAILURES; i++) expect((await login("mala")).status).not.toBe(200);
    const res = await login(password);
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toContain("Demasiados intentos");
  });

  it("un login correcto reinicia la cuenta", async () => {
    for (let i = 0; i < MAX_FAILURES - 1; i++) await login("mala");
    expect((await login(password)).status).toBe(200);
    for (let i = 0; i < MAX_FAILURES - 1; i++) await login("mala");
    expect((await login(password)).status).toBe(200);
  });

  it("el bloqueo es por cuenta: otra cuenta no se ve afectada", async () => {
    for (let i = 0; i < MAX_FAILURES; i++) await login("mala");
    expect((await login("mala", "otra@example.com")).status).not.toBe(429);
  });

  it("el bloqueo vence y no distingue mayúsculas", async () => {
    const t0 = Date.now();
    for (let i = 0; i < MAX_FAILURES; i++) await recordFailure(email.toUpperCase(), t0);
    expect(await lockedMinutes(email, t0 + 60_000)).toBeGreaterThan(0);
    expect(await lockedMinutes(email, t0 + 16 * 60_000)).toBe(0);
  });
});
