import React, { useCallback, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/Button";

const card =
  "bg-theme-card-bg border border-theme-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4";

type PasskeyRow = { id: string; name?: string | null; createdAt?: Date | string | null };

const fmt = (d?: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })
    : "";

// Pantalla que se muestra cuando el admin ya tiene passkey y entró solo con contraseña
export const PasskeyGate: React.FC<{ onVerified: () => void }> = ({ onVerified }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.passkey();
    setBusy(false);
    if (res?.error) {
      setError("No se pudo verificar la passkey. Probá de nuevo.");
      return;
    }
    onVerified();
  };

  return (
    <div className={`${card} items-start`}>
      <div className="flex items-center gap-3">
        <KeyRound className="w-6 h-6 text-theme-accent" aria-hidden />
        <h2 className="text-xl font-bold m-0 text-theme-text">Confirmá que sos vos</h2>
      </div>
      <p className="m-0 text-sm text-theme-text-muted">
        El panel de administración se abre con tu passkey (huella, cara o PIN del dispositivo).
      </p>
      {error && <p className="m-0 text-sm text-theme-danger">{error}</p>}
      <Button type="button" onClick={verify} isLoading={busy}>
        Entrar con passkey
      </Button>
    </div>
  );
};

// Lista de passkeys del admin, con alta y baja
export const PasskeyCard: React.FC = () => {
  const [keys, setKeys] = useState<PasskeyRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authClient.passkey.listUserPasskeys();
    setKeys(((res.data ?? []) as PasskeyRow[]).slice());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setBusy("add");
    setError(null);
    const res = await authClient.passkey.addPasskey({ name: navigator.platform || "Passkey" });
    if (res?.error) setError(res.error.message || "No se pudo crear la passkey");
    await load();
    setBusy(null);
  };

  const remove = async (id: string) => {
    if (keys && keys.length === 1 && !confirm("Es tu única passkey. ¿Borrarla igual?")) return;
    setBusy(id);
    setError(null);
    const res = await authClient.passkey.deletePasskey({ id });
    if (res?.error) setError(res.error.message || "No se pudo borrar la passkey");
    await load();
    setBusy(null);
  };

  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold m-0 text-theme-text">Passkeys</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={add}
          isLoading={busy === "add"}
        >
          Agregar passkey
        </Button>
      </div>
      {keys !== null && keys.length === 0 && (
        <div className="px-4 py-3 rounded-lg text-sm border bg-theme-danger-light text-theme-danger border-theme-danger">
          Todavía no tenés passkey. Creá una: desde ese momento el panel solo abre con ella, aunque
          alguien tenga tu contraseña.
        </div>
      )}
      {keys !== null && keys.length > 0 && (
        <p className="m-0 text-sm text-theme-text-muted">
          El panel solo abre con una de estas passkeys. Conviene tener dos (por ejemplo, celular y
          computadora) por si perdés una.
        </p>
      )}
      {error && <p className="m-0 text-sm text-theme-danger">{error}</p>}
      {keys && keys.length > 0 && (
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 border border-theme-border rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <KeyRound className="w-4 h-4 shrink-0 text-theme-text-muted" aria-hidden />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-theme-text truncate">
                    {k.name || "Passkey"}
                  </span>
                  <span className="text-xs text-theme-text-muted">Creada {fmt(k.createdAt)}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(k.id)}
                isLoading={busy === k.id}
                disabled={busy !== null}
              >
                Borrar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
