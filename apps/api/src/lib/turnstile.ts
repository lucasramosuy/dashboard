// Verificación de Cloudflare Turnstile para el login y el registro.
// Si falta TURNSTILE_SECRET_KEY (tests, local, preview) no se verifica nada.
// El smoke test del deploy no puede resolver el widget: si manda x-smoke-key igual al
// secret SMOKE_KEY del Worker, se saltea la verificación (el rate limit sigue aplicando).
import { logger } from "./logger";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type CaptchaResult = { ok: true } | { ok: false; error: string };

export async function checkCaptcha(headers: Headers): Promise<CaptchaResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  const smokeKey = process.env.SMOKE_KEY;
  const smokeHeader = headers.get("x-smoke-key");
  if (smokeKey && smokeHeader && safeEqual(smokeHeader, smokeKey)) return { ok: true };

  const token = headers.get("x-captcha-response");
  if (!token) {
    return {
      ok: false,
      error: "Falta la verificación anti-bots. Recargá la página y probá de nuevo.",
    };
  }

  const form = new URLSearchParams({ secret, response: token });
  const ip = headers.get("cf-connecting-ip");
  if (ip) form.set("remoteip", ip);

  let res: Response;
  try {
    res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
  } catch (err) {
    // Si Cloudflare no responde, no dejamos a nadie afuera: se loguea y sigue
    logger.error("[Turnstile] siteverify no respondió", err);
    return { ok: true };
  }
  if (!res.ok) {
    logger.error(`[Turnstile] siteverify respondió ${res.status}`);
    return { ok: true };
  }
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) {
    return {
      ok: false,
      error: "No pudimos verificar que no seas un bot. Recargá la página y probá de nuevo.",
    };
  }
  return { ok: true };
}
