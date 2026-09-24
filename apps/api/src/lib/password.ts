import { verifyPassword as verifyScrypt } from "better-auth/crypto";

// Hash de contraseñas con PBKDF2-SHA256 (WebCrypto nativo).
//
// Por qué no el scrypt por defecto de better-auth: en Cloudflare Workers (plan
// gratuito) cada request tiene 10 ms de CPU y scrypt consume 70-160 ms. PBKDF2
// con 30k iteraciones mide 4-12 ms en Workers (spike del 24/09/2026).
//
// Formato guardado: pbkdf2$sha256$<iteraciones>$<salt b64>$<hash b64>
// Los hashes viejos (scrypt, "salt:hash") se siguen verificando para no dejar
// afuera a nadie; se reemplazan al cambiar la contraseña (scripts/set-password.ts).

const ITERATIONS = 30_000;
const PREFIX = "pbkdf2$sha256$";
const enc = new TextEncoder();

const toB64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as Uint8Array<ArrayBuffer>, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }) {
  if (hash.startsWith(PREFIX)) {
    const [iterStr, saltB64, hashB64] = hash.slice(PREFIX.length).split("$");
    const iterations = Number(iterStr);
    if (!Number.isInteger(iterations) || iterations <= 0 || !saltB64 || !hashB64) return false;
    const expected = fromB64(hashB64);
    const actual = await derive(password, fromB64(saltB64), iterations);
    return timingSafeEqual(actual, expected);
  }
  // Hash heredado de scrypt (formato por defecto de better-auth)
  return verifyScrypt({ hash, password });
}

export const isLegacyHash = (hash: string) => !hash.startsWith(PREFIX);
