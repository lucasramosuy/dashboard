// Passkey obligatoria para el panel de admin.
// - Los admins (ADMIN_EMAILS) pueden registrar passkeys; el resto de los usuarios no.
// - Si un admin ya tiene al menos una passkey, el panel solo abre con una sesión
//   iniciada con passkey (session.passkey_at). Con contraseña sola: 403 PASSKEY_REQUIRED.
// - Mientras no tenga ninguna, el panel sigue abriendo y muestra el aviso para crearla.
// - Agregar, renombrar o borrar passkeys también exige sesión con passkey (si ya hay una):
//   si no, con la contraseña robada alguien podría borrar la passkey o sumar la suya.
import { db } from "./db";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isAdminEmail = (email: string) => adminEmails().includes(email.toLowerCase());

export async function countPasskeys(userId: string): Promise<number> {
  const r = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM passkey WHERE userId = ?",
    args: [userId],
  });
  return Number(r.rows[0]?.n ?? 0);
}

export async function sessionHasPasskey(sessionId: string): Promise<boolean> {
  const r = await db.execute({
    sql: "SELECT passkey_at FROM session WHERE id = ?",
    args: [sessionId],
  });
  return Boolean(r.rows[0]?.passkey_at);
}

export async function markSessionPasskey(sessionId: string) {
  await db.execute({
    sql: "UPDATE session SET passkey_at = ? WHERE id = ?",
    args: [new Date().toISOString(), sessionId],
  });
}

export type PasskeyGate = "ok" | "not-admin" | "passkey-required";

// ¿Puede esta sesión entrar al panel / tocar passkeys?
export async function checkAdminPasskey(
  user: { id: string; email: string },
  sessionId: string,
): Promise<PasskeyGate> {
  if (!isAdminEmail(user.email)) return "not-admin";
  if ((await countPasskeys(user.id)) === 0) return "ok";
  return (await sessionHasPasskey(sessionId)) ? "ok" : "passkey-required";
}

// Endpoints de Better Auth que cambian las passkeys de la cuenta
export const PASSKEY_MUTATION_PATHS = new Set([
  "/passkey/generate-register-options",
  "/passkey/verify-registration",
  "/passkey/register",
  "/passkey/delete-passkey",
  "/passkey/update-passkey",
]);
