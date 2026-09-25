import { afterEach, describe, expect, it } from "bun:test";
import { checkCaptcha } from "../src/lib/turnstile";

const realFetch = globalThis.fetch;

afterEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.SMOKE_KEY;
  globalThis.fetch = realFetch;
});

function mockSiteverify(success: boolean) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ success }), { status: 200 })) as unknown as typeof fetch;
}

describe("checkCaptcha", () => {
  it("no verifica nada si no hay TURNSTILE_SECRET_KEY", async () => {
    expect(await checkCaptcha(new Headers())).toEqual({ ok: true });
  });

  it("rechaza si falta el token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secreto";
    const r = await checkCaptcha(new Headers());
    expect(r.ok).toBe(false);
  });

  it("deja pasar el smoke test con la clave correcta", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secreto";
    process.env.SMOKE_KEY = "clave-smoke";
    expect(await checkCaptcha(new Headers({ "x-smoke-key": "clave-smoke" }))).toEqual({
      ok: true,
    });
    const r = await checkCaptcha(new Headers({ "x-smoke-key": "otra" }));
    expect(r.ok).toBe(false);
  });

  it("acepta o rechaza según la respuesta de Cloudflare", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secreto";
    mockSiteverify(true);
    expect((await checkCaptcha(new Headers({ "x-captcha-response": "t" }))).ok).toBe(true);
    mockSiteverify(false);
    expect((await checkCaptcha(new Headers({ "x-captcha-response": "t" }))).ok).toBe(false);
  });

  it("deja pasar si Cloudflare no responde", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secreto";
    globalThis.fetch = (async () => {
      throw new Error("sin red");
    }) as unknown as typeof fetch;
    expect((await checkCaptcha(new Headers({ "x-captcha-response": "t" }))).ok).toBe(true);
  });
});
