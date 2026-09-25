// Registro de acciones del panel de admin (tabla admin_log).
// Guarda quién hizo qué y cuándo, nunca datos sensibles: ni contraseñas temporales
// ni códigos de invitación. Se conservan las últimas 500 entradas.
import { db } from "./db";
import { logger } from "./logger";

export type AdminAction = "reset_password" | "invite_create" | "invite_delete";

const KEEP = 500;

export async function logAdminAction(entry: {
  actorId: string;
  actorEmail: string;
  action: AdminAction;
  target?: string | null;
  ip?: string | null;
}) {
  try {
    await db.execute({
      sql: `INSERT INTO admin_log (id, created_at, actor_id, actor_email, action, target, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        new Date().toISOString(),
        entry.actorId,
        entry.actorEmail,
        entry.action,
        entry.target ?? null,
        entry.ip ?? null,
      ],
    });
    await db.execute({
      sql: `DELETE FROM admin_log WHERE id NOT IN
              (SELECT id FROM admin_log ORDER BY created_at DESC LIMIT ?)`,
      args: [KEEP],
    });
  } catch (err) {
    // El registro nunca frena la acción: si falla, se loguea y sigue
    logger.error("[admin_log] no se pudo guardar", err);
  }
}

export async function listAdminLog(limit = 50) {
  const r = await db.execute({
    sql: `SELECT id, created_at, actor_email, action, target, ip
            FROM admin_log ORDER BY created_at DESC LIMIT ?`,
    args: [Math.min(Math.max(limit, 1), 200)],
  });
  return r.rows.map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    actorEmail: row.actor_email as string,
    action: row.action as AdminAction,
    target: (row.target as string | null) ?? null,
    ip: (row.ip as string | null) ?? null,
  }));
}
