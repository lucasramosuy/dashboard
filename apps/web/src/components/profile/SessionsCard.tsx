import React, { useCallback, useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/Button";

type SessionRow = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// "Chrome en Windows", "Safari en iPhone", etc. a partir del user-agent
export function describeDevice(ua?: string | null): { label: string; mobile: boolean } {
  if (!ua) return { label: "Dispositivo desconocido", mobile: false };
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  const mobile = /iPhone|Android|Mobile/.test(ua);
  return { label: os ? `${browser} en ${os}` : browser, mobile };
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleString("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Sesiones abiertas de la cuenta, con opción de cerrar las que no sean la actual
export const SessionsCard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, current] = await Promise.all([authClient.listSessions(), authClient.getSession()]);
    if (list.error) {
      setError("No se pudieron cargar las sesiones");
      setSessions([]);
      return;
    }
    setCurrentToken(current.data?.session.token ?? null);
    const rows = (list.data ?? []) as SessionRow[];
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setSessions(rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (token: string) => {
    setBusy(token);
    setError(null);
    const { error } = await authClient.revokeSession({ token });
    if (error) setError("No se pudo cerrar la sesión");
    await load();
    setBusy(null);
  };

  const revokeOthers = async () => {
    setBusy("others");
    setError(null);
    const { error } = await authClient.revokeOtherSessions();
    if (error) setError("No se pudieron cerrar las otras sesiones");
    await load();
    setBusy(null);
  };

  const others = (sessions ?? []).filter((s) => s.token !== currentToken);

  return (
    <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold m-0 text-theme-text">Sesiones activas</h2>
        {others.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={revokeOthers}
            isLoading={busy === "others"}
          >
            Cerrar las demás
          </Button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm border bg-theme-danger-light text-theme-danger border-theme-danger">
          {error}
        </div>
      )}

      {sessions === null ? (
        <p className="m-0 text-sm text-theme-text-muted">Cargando...</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-theme-border">
          {sessions.map((s) => {
            const device = describeDevice(s.userAgent);
            const Icon = device.mobile ? Smartphone : Monitor;
            const isCurrent = s.token === currentToken;
            return (
              <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Icon className="w-5 h-5 shrink-0 text-theme-text-muted" aria-hidden />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-theme-text">
                    {device.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-theme-success">
                        Esta sesión
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-theme-text-muted">
                    Última actividad {fmt(s.updatedAt)}
                    {s.ipAddress ? ` · IP ${s.ipAddress}` : ""}
                  </span>
                </div>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(s.token)}
                    isLoading={busy === s.token}
                    disabled={busy !== null}
                  >
                    Cerrar
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
