// Token de Cloudflare Turnstile para el login y el registro. Lo guarda el widget
// (components/auth/Turnstile.tsx) y lo leen api.login / api.register como header.
// Sin PUBLIC_TURNSTILE_SITE_KEY (local, preview) no hay widget y no se manda nada.
export const TURNSTILE_SITE_KEY: string = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "";

let token: string | null = null;
let resetFn: (() => void) | null = null;

export function setCaptchaToken(value: string | null) {
  token = value;
}

export function registerCaptchaReset(fn: (() => void) | null) {
  resetFn = fn;
}

// Los tokens son de un solo uso: después de cada intento se pide uno nuevo
export function resetCaptcha() {
  token = null;
  resetFn?.();
}

export function captchaHeaders(): Record<string, string> {
  return token ? { "x-captcha-response": token } : {};
}
