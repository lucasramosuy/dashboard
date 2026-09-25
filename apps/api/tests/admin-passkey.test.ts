import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import { db } from "../src/lib/db";

const ADMIN = "pk-admin@example.com";
const USER = "pk-user@example.com";
const PASS = "clave-segura-123";

async function login(email: string): Promise<string> {
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: PASS }),
    headers: { "Content-Type": "application/json" },
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error(`login falló (${res.status})`);
  return cookie;
}

const req = (path: string, cookie: string, method = "GET", body?: unknown) =>
  app.request(path, {
    method,
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

async function userId(email: string) {
  const r = await db.execute({ sql: "SELECT id FROM user WHERE email = ?", args: [email] });
  return r.rows[0]!.id as string;
}

async function addFakePasskey(email: string) {
  await db.execute({
    sql: `INSERT INTO passkey (id, name, publicKey, userId, credentialID, counter, deviceType, backedUp)
          VALUES (?, 'Test', 'pk', ?, ?, 0, 'singleDevice', 0)`,
    args: [crypto.randomUUID(), await userId(email), crypto.randomUUID()],
  });
}

describe("Passkey del panel admin", () => {
  beforeEach(async () => {
    process.env.ADMIN_EMAILS = ADMIN;
    await db.execute({ sql: "DELETE FROM user WHERE email IN (?, ?)", args: [ADMIN, USER] });
    await auth.api.signUpEmail({ body: { email: ADMIN, password: PASS, name: "Admin" } });
    await auth.api.signUpEmail({ body: { email: USER, password: PASS, name: "User" } });
  });

  it("sin passkey el admin entra con contraseña y ve el aviso", async () => {
    const cookie = await login(ADMIN);
    const me = await (await req("/api/admin/me", cookie)).json();
    expect(me).toEqual({ admin: true, passkeys: 0, passkeyRequired: false });
    expect((await req("/api/admin/users", cookie)).status).toBe(200);
  });

  it("con passkey, la contraseña sola no abre el panel", async () => {
    await addFakePasskey(ADMIN);
    const cookie = await login(ADMIN);
    const me = (await (await req("/api/admin/me", cookie)).json()) as { passkeyRequired: boolean };
    expect(me.passkeyRequired).toBe(true);
    const res = await req("/api/admin/users", cookie);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("PASSKEY_REQUIRED");
  });

  it("con passkey, una sesión marcada como passkey abre el panel", async () => {
    await addFakePasskey(ADMIN);
    const cookie = await login(ADMIN);
    await db.execute({
      sql: "UPDATE session SET passkey_at = ? WHERE userId = ?",
      args: [new Date().toISOString(), await userId(ADMIN)],
    });
    expect((await req("/api/admin/users", cookie)).status).toBe(200);
  });

  it("con passkey, la contraseña sola no puede borrar ni sumar passkeys", async () => {
    await addFakePasskey(ADMIN);
    const cookie = await login(ADMIN);
    const del = await req("/api/auth/passkey/delete-passkey", cookie, "POST", { id: "x" });
    expect(del.status).toBe(403);
    const add = await req("/api/auth/passkey/generate-register-options", cookie);
    expect(add.status).toBe(403);
  });

  it("un usuario común no puede registrar passkeys", async () => {
    const cookie = await login(USER);
    const add = await req("/api/auth/passkey/generate-register-options", cookie);
    expect(add.status).toBe(403);
  });
});
