import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../src/server";
import { dbService, initDB } from "../src/lib/db";
import { randomUUID } from "node:crypto";

describe("Invites & Registration API Tests", () => {
  beforeAll(async () => {
    await initDB();
  });

  it("should create an invite and allow registration", async () => {
    // 1. Crear un invite directamente en la DB
    const inviteCode = "TEST-INVITE-" + Math.random().toString(36).substring(7);
    const invite = {
      id: randomUUID(),
      code: inviteCode,
      used: false,
      created_at: new Date(),
    };
    await dbService.invites.create(invite);

    // 2. Registrar un nuevo usuario con ese invite
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: `test-${randomUUID()}@example.com`,
        password: "password123",
        inviteCode: inviteCode,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const body = (await regRes.json()) as any;

    // Si falla, esto nos dirá por qué falló exactamente (ej. validación, error de DB, etc.)
    if (!regRes.ok) {
      console.error("Error en registro:", body);
    }

    // Aceptamos tanto 201 (Created) como 200 (OK) como éxito
    expect([200, 201]).toContain(regRes.status);

    expect(body).toHaveProperty("user");
    expect(body.user.name).toBe("Test User");

    // 3. Verificar que el invite esté marcado como usado
    const updatedInvite = await dbService.invites.getByCode(inviteCode);
    expect(updatedInvite?.used).toBe(true);
  });

  it("should fail registration with an already used invite", async () => {
    // 1. Crear un invite usado
    const inviteCode = "USED-INVITE-" + Math.random().toString(36).substring(7);
    const invite = {
      id: randomUUID(),
      code: inviteCode,
      used: true,
      created_at: new Date(),
    };
    await dbService.invites.create(invite);

    // 2. Intentar registrarse
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Fail User",
        email: "fail@example.com",
        password: "password123",
        inviteCode: inviteCode,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(regRes.status).toBe(403);
    const body = (await regRes.json()) as any;
    expect(body.error).toContain("inválido o ha sido usado");
  });

  it("should fail registration with a non-existent invite", async () => {
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Fail User",
        email: "nonexistent@example.com",
        password: "password123",
        inviteCode: "NON-EXISTENT",
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(regRes.status).toBe(403);
  });

  it("should fail registration with a duplicate email", async () => {
    // 1. Crear un usuario primero
    const email = `duplicate-${randomUUID()}@example.com`;
    const inviteCode1 = "INVITE-1-" + randomUUID();
    await dbService.invites.create({
      id: randomUUID(),
      code: inviteCode1,
      used: false,
      created_at: new Date(),
    });

    await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "User 1",
        email: email,
        password: "password123",
        inviteCode: inviteCode1,
      }),
      headers: { "Content-Type": "application/json" },
    });

    // 2. Intentar registrar otro usuario con el mismo email
    const inviteCode2 = "INVITE-2-" + randomUUID();
    await dbService.invites.create({
      id: randomUUID(),
      code: inviteCode2,
      used: false,
      created_at: new Date(),
    });

    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "User 2",
        email: email,
        password: "password123",
        inviteCode: inviteCode2,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(regRes.status).toBe(409);
    const body = (await regRes.json()) as any;
    expect(body.error).toContain("ya está en uso");
  });

  it("countActive should correctly count unused invites", async () => {
    const initialCount = await dbService.invites.countActive();

    // Crear 2 invites nuevos
    await dbService.invites.create({
      id: randomUUID(),
      code: "COUNT-1-" + randomUUID(),
      used: false,
      created_at: new Date(),
    });
    await dbService.invites.create({
      id: randomUUID(),
      code: "COUNT-2-" + randomUUID(),
      used: false,
      created_at: new Date(),
    });

    // Crear 1 invite ya usado
    await dbService.invites.create({
      id: randomUUID(),
      code: "COUNT-3-" + randomUUID(),
      used: true,
      created_at: new Date(),
    });

    const finalCount = await dbService.invites.countActive();
    expect(finalCount).toBe(initialCount + 2);
  });
});
