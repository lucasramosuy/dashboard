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
  const r = await db.execute({
    sql: "SELECT failures, locked_until, updated_at FROM login_attempt WHERE email = ?",
    args: [key],
  });
  const row = r.rows[0];
  // Un bloqueo vencido o un último fallo de hace más que la ventana empieza de cero
  const stale = !row || now - Number(row.updated_at) > LOCK_MINUTES * 60_000;
  const failures = (stale ? 0 : Number(row.failures)) + 1;
  const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_MINUTES * 60_000 : null;
  await db.execute({
    sql: `INSERT INTO login_attempt (email, failures, locked_until, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET failures = excluded.failures,
            locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
    args: [key, failures, lockedUntil, now],
  });
}

export async function clearFailures(email: string): Promise<void> {
  await db.execute({ sql: "DELETE FROM login_attempt WHERE email = ?", args: [norm(email)] });
}
