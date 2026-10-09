// Bloqueo por cuenta: tras demasiados intentos fallidos con el mismo email, el login
// queda bloqueado un rato. Complementa el rate limit por IP, que no frena a quien
// ataca una cuenta desde muchas IPs.
import { db } from "./db";

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

const norm = (email: string) => email.trim().toLowerCase();

/** Minutos que faltan para que se desbloquee la cuenta, o 0 si no está bloqueada. */
export async function lockedMinutes(email: string, now = Date.now()): Promise<number> {
  const r = await db.execute({
    sql: "SELECT locked_until FROM login_attempt WHERE email = ?",
    args: [norm(email)],
  });
  const until = Number(r.rows[0]?.locked_until ?? 0);
  return until > now ? Math.ceil((until - now) / 60_000) : 0;
}

export async function recordFailure(email: string, now = Date.now()): Promise<void> {
  const key = norm(email);
  // Una sola operación distribuida evita leer y después sobrescribir el contador
  // de otra instancia. La ventana y el umbral son los mismos que en #117.
  await db.execute({
    sql: `INSERT INTO login_attempt (email, failures, locked_until, updated_at)
          VALUES (?, 1, NULL, ?)
          ON CONFLICT(email) DO UPDATE SET
            failures = CASE WHEN ? - login_attempt.updated_at > ? THEN 1
                            ELSE login_attempt.failures + 1 END,
            locked_until = CASE
              WHEN (CASE WHEN ? - login_attempt.updated_at > ? THEN 1
                         ELSE login_attempt.failures + 1 END) >= ? THEN ?
              ELSE NULL END,
            updated_at = excluded.updated_at`,
    args: [
      key,
      now,
      now,
      LOCK_MINUTES * 60_000,
      now,
      LOCK_MINUTES * 60_000,
      MAX_FAILURES,
      now + LOCK_MINUTES * 60_000,
    ],
  });
}

export async function clearFailures(email: string): Promise<void> {
  await db.execute({ sql: "DELETE FROM login_attempt WHERE email = ?", args: [norm(email)] });
}
