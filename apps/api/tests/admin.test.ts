import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import { db } from "../src/lib/db";

const ADMIN = "admin@example.com";
const USER = "user@example.com";
const PASS = "clave-segura-123";

async function login(email: string, password = PASS): Promise<string> {
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error(`login falló (${res.status})`);
  return cookie;
}

const req = (path: string, cookie: string, method = "GET") =>
  app.request(path, { method, headers: { Cookie: cookie } });

describe("Panel admin", () => {
  beforeEach(async () => {
    process.env.ADMIN_EMAILS = ` ${ADMIN.toUpperCase()} , otro@example.com`;
    await auth.api.signUpEmail({ body: { email: ADMIN, password: PASS, name: "Admin" } });
    await auth.api.signUpEmail({ body: { email: USER, password: PASS, name: "User" } });
  });

  it("sin sesión da 401", async () => {
    expect((await app.request("/api/admin/users")).status).toBe(401);
  });

  it("un usuario común ve admin=false y no accede al resto", async () => {
    const cookie = await login(USER);
    expect(await (await req("/api/admin/me", cookie)).json()).toEqual({ admin: false });
    expect((await req("/api/admin/users", cookie)).status).toBe(403);
    expect((await req("/api/admin/invites", cookie, "POST")).status).toBe(403);
  });

  it("el admin lista usuarios sin exponer hashes", async () => {
    const cookie = await login(ADMIN);
    expect(await (await req("/api/admin/me", cookie)).json()).toEqual({ admin: true });
    const users = (await (await req("/api/admin/users", cookie)).json()) as Record<
      string,
      unknown
    >[];
    expect(users.map((u) => u.email).sort()).toEqual([ADMIN, USER]);
    expect(users.find((u) => u.email === ADMIN)?.admin).toBe(true);
    expect(users[0].legacyHash).toBe(false);
    expect(JSON.stringify(users)).not.toContain("pbkdf2$");
  });

  it("crea, lista y anula invites; el código creado sirve para registrarse", async () => {
    const cookie = await login(ADMIN);
    const created = (await (await req("/api/admin/invites", cookie, "POST")).json()) as {
      id: string;
      code: string;
    };
    expect(created.code).toMatch(/^[A-Z2-9]{8}$/);
    const list = (await (await req("/api/admin/invites", cookie)).json()) as { id: string }[];
    expect(list.map((i) => i.id)).toContain(created.id);

    const reg = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Nuevo",
        email: "nuevo@example.com",
        password: PASS,
        inviteCode: created.code,
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(reg.status).toBe(201);
    const after = (await (await req("/api/admin/invites", cookie)).json()) as { id: string }[];
    expect(after.map((i) => i.id)).not.toContain(created.id);

    const other = (await (await req("/api/admin/invites", cookie, "POST")).json()) as {
      id: string;
    };
    expect((await req(`/api/admin/invites/${other.id}`, cookie, "DELETE")).status).toBe(200);
    expect((await req(`/api/admin/invites/${other.id}`, cookie, "DELETE")).status).toBe(404);
  });

  it("resetea la contraseña: la vieja deja de andar, la temporal entra y se cierran sus sesiones", async () => {
    const userCookie = await login(USER);
    const adminCookie = await login(ADMIN);
    const userId = (await db.execute({ sql: "SELECT id FROM user WHERE email = ?", args: [USER] }))
      .rows[0].id as string;

    const res = await req(`/api/admin/users/${userId}/reset-password`, adminCookie, "POST");
    expect(res.status).toBe(200);
    const { password } = (await res.json()) as { password: string };
    expect(password).toHaveLength(12);

    const session = await app.request("/api/auth/get-session", { headers: { Cookie: userCookie } });
    expect(await session.json()).toBeNull();
    await expect(login(USER)).rejects.toThrow();
    await login(USER, password);
  });

  it("no deja resetear la propia cuenta", async () => {
    const adminCookie = await login(ADMIN);
    const adminId = (
      await db.execute({ sql: "SELECT id FROM user WHERE email = ?", args: [ADMIN] })
    ).rows[0].id as string;
    const res = await req(`/api/admin/users/${adminId}/reset-password`, adminCookie, "POST");
    expect(res.status).toBe(400);
    const session = await app.request("/api/auth/get-session", {
      headers: { Cookie: adminCookie },
    });
    expect(await session.json()).not.toBeNull();
    const users = (await (await req("/api/admin/users", adminCookie)).json()) as {
      email: string;
      self: boolean;
    }[];
    expect(users.find((u) => u.email === ADMIN)?.self).toBe(true);
  });
});

describe("Registro de acciones del admin", () => {
  beforeEach(async () => {
    process.env.ADMIN_EMAILS = ADMIN;
    await db.execute("DELETE FROM admin_log");
    await auth.api.signUpEmail({ body: { email: ADMIN, password: PASS, name: "Admin" } });
    await auth.api.signUpEmail({ body: { email: USER, password: PASS, name: "User" } });
  });

  it("registra reset, alta y baja de invitación sin guardar secretos", async () => {
    const cookie = await login(ADMIN);
    const users = (await (await req("/api/admin/users", cookie)).json()) as {
      id: string;
      email: string;
    }[];
    const target = users.find((u) => u.email === USER)!;
    const reset = (await (
      await req(`/api/admin/users/${target.id}/reset-password`, cookie, "POST")
    ).json()) as { password: string };
    const invite = (await (await req("/api/admin/invites", cookie, "POST")).json()) as {
      id: string;
      code: string;
    };
    await req(`/api/admin/invites/${invite.id}`, cookie, "DELETE");

    const log = (await (await req("/api/admin/log", cookie)).json()) as {
      action: string;
      target: string | null;
      actorEmail: string;
    }[];
    expect(log.map((e) => e.action)).toEqual(["invite_delete", "invite_create", "reset_password"]);
    expect(log[2]!.target).toBe(USER);
    expect(log.every((e) => e.actorEmail === ADMIN)).toBe(true);
    const raw = JSON.stringify(log);
    expect(raw).not.toContain(reset.password);
    expect(raw).not.toContain(invite.code);
  });

  it("un usuario común no ve el registro", async () => {
    const cookie = await login(USER);
    expect((await req("/api/admin/log", cookie)).status).toBe(403);
  });
});
