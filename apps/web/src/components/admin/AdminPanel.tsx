import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { api, type AdminInvite, type AdminUser } from "../../lib/api";
import { ProfileSkeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";

const card =
  "bg-theme-card-bg border border-theme-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4";

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" }) : "nunca";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

const Panel: React.FC = () => {
  const [state, setState] = useState<"loading" | "forbidden" | "ready" | "error">("loading");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Contraseña temporal recién generada: se muestra una sola vez
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const { admin } = await api.adminMe();
      if (!admin) return setState("forbidden");
      const [u, i] = await Promise.all([api.adminUsers(), api.adminInvites()]);
      setUsers(u);
      setInvites(i);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  };

  const createInvite = () =>
    run(async () => {
      const invite = await api.adminCreateInvite();
      setInvites((prev) => [invite, ...prev]);
    });

  const deleteInvite = (id: string) =>
    run(async () => {
      await api.adminDeleteInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    });

  const resetPassword = (user: AdminUser) => {
    if (!confirm(`¿Resetear la contraseña de ${user.email}? Se le cierran las sesiones abiertas.`))
      return;
    run(async () => {
      const { password } = await api.adminResetPassword(user.id);
      setTempPassword({ email: user.email, password });
      setUsers(await api.adminUsers());
    });
  };

  if (state === "loading") return <ProfileSkeleton />;
  if (state === "forbidden" || state === "error") {
    return (
      <div className={card}>
        <h1 className="m-0 text-xl font-bold text-theme-text">Administración</h1>
        <p className="m-0 text-sm text-theme-text-muted">
          {state === "forbidden"
            ? "Esta sección es solo para administradores."
            : "No se pudo cargar el panel. Probá de nuevo en un rato."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col gap-1 mb-2">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight text-theme-text">
          Administración
        </h1>
        <p className="text-theme-text-muted m-0 text-sm sm:text-base">
          Usuarios, invitaciones y contraseñas.
        </p>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm border bg-theme-danger-light text-theme-danger border-theme-danger">
          {error}
        </div>
      )}

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold m-0 text-theme-text">Invitaciones</h2>
          <Button type="button" onClick={createInvite} disabled={busy}>
            Crear invitación
          </Button>
        </div>
        <p className="m-0 text-sm text-theme-text-muted">
          Cada código sirve para una sola cuenta. Pasáselo a quien quieras invitar: se registra en
          la pantalla de inicio con "¿Tenes código? Regístrate".
        </p>
        {invites.length === 0 ? (
          <p className="m-0 text-sm text-theme-text-muted">No hay códigos sin usar.</p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 border border-theme-border rounded-lg px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-base tracking-wider text-theme-text">
                    {i.code}
                  </span>
                  <span className="text-xs text-theme-text-muted">Creado {fmt(i.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  <CopyButton text={i.code} />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => deleteInvite(i.id)}
                    disabled={busy}
                  >
                    Anular
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold m-0 text-theme-text">Usuarios</h2>
        {tempPassword && (
          <div className="px-4 py-3 rounded-lg text-sm border bg-theme-success-light text-theme-success border-theme-success flex flex-col gap-2">
            <span>
              Contraseña temporal de {tempPassword.email}. Se muestra solo esta vez: pasásela y que
              la cambie desde su perfil.
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base text-theme-text">{tempPassword.password}</span>
              <CopyButton text={tempPassword.password} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTempPassword(null)}
              >
                Listo
              </Button>
            </div>
          </div>
        )}
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-theme-border rounded-lg px-3 py-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-theme-text truncate">
                  {u.name}
                  {u.admin && (
                    <span className="ml-2 text-xs font-medium text-theme-text-muted">admin</span>
                  )}
                </span>
                <span className="text-xs text-theme-text-muted truncate">{u.email}</span>
                <span className="text-xs text-theme-text-muted">
                  Alta {fmt(u.createdAt)} · Última sesión {fmt(u.lastSeen)}
                  {u.legacyHash && " · clave en formato viejo (se actualiza al entrar)"}
                </span>
              </div>
              {u.hasPassword && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => resetPassword(u)}
                  disabled={busy}
                >
                  Resetear contraseña
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export const AdminPanel: React.FC = () => (
  <AppShell>
    <Panel />
  </AppShell>
);
