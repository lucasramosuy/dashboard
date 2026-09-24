import { describe, it, expect } from "bun:test";
import { hashPassword as scryptHash } from "better-auth/crypto";
import { hashPassword, verifyPassword, isLegacyHash } from "../src/lib/password";

describe("password (PBKDF2)", () => {
  it("genera hashes PBKDF2 con salt distinta cada vez", async () => {
    const a = await hashPassword("clave-segura-1");
    const b = await hashPassword("clave-segura-1");
    expect(a.startsWith("pbkdf2$sha256$30000$")).toBe(true);
    expect(a).not.toBe(b);
    expect(isLegacyHash(a)).toBe(false);
  });

  it("verifica la contraseña correcta y rechaza la incorrecta", async () => {
    const hash = await hashPassword("clave-segura-1");
    expect(await verifyPassword({ hash, password: "clave-segura-1" })).toBe(true);
    expect(await verifyPassword({ hash, password: "clave-segura-2" })).toBe(false);
  });

  it("sigue aceptando hashes scrypt viejos", async () => {
    const legacy = await scryptHash("clave-vieja");
    expect(isLegacyHash(legacy)).toBe(true);
    expect(await verifyPassword({ hash: legacy, password: "clave-vieja" })).toBe(true);
    expect(await verifyPassword({ hash: legacy, password: "otra" })).toBe(false);
  });

  it("rechaza hashes PBKDF2 mal formados", async () => {
    expect(await verifyPassword({ hash: "pbkdf2$sha256$abc$$", password: "x" })).toBe(false);
  });
});
