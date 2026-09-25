import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api, type AdminLogEntry } from "../../lib/api";

const card =
  "bg-theme-card-bg border border-theme-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4";

const LABELS: Record<AdminLogEntry["action"], string> = {
  reset_password: "Reseteó la contraseña de",
  invite_create: "Creó una invitación",
  invite_delete: "Anuló una invitación",
};

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Últimas acciones hechas desde el panel. `refreshKey` cambia después de cada acción.
export const AdminLogCard: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [entries, setEntries] = useState<AdminLogEntry[] | null>(null);

  useEffect(() => {
    api
      .adminLog(30)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [refreshKey]);

  return (
    <section className={card}>
      <div className="flex items-center gap-3">
        <History className="w-5 h-5 text-theme-text-muted" aria-hidden />
        <h2 className="text-xl font-bold m-0 text-theme-text">Registro</h2>
      </div>
      {entries === null ? (
        <p className="m-0 text-sm text-theme-text-muted">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="m-0 text-sm text-theme-text-muted">Todavía no hay acciones registradas.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-theme-border">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col py-2 first:pt-0 last:pb-0">
              <span className="text-sm text-theme-text">
                {LABELS[e.action] ?? e.action}
                {e.target ? <span className="font-medium"> {e.target}</span> : null}
              </span>
              <span className="text-xs text-theme-text-muted">
                {fmt(e.createdAt)} · {e.actorEmail}
                {e.ip ? ` · IP ${e.ip}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
