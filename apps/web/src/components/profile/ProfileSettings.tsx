import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AppShell } from "../layout/AppShell";
import { authClient } from "../../lib/auth-client";
import { ProfileSkeleton } from "../ui/Skeleton";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent disabled:opacity-60 disabled:cursor-not-allowed";

const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      setMessage({ type: "error", text: error.message || "Error al actualizar perfil" });
    } else {
      setMessage({ type: "success", text: "Datos actualizados correctamente" });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsSaving(false);
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col gap-1 mb-2">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight text-theme-text">Mi Perfil</h1>
        <p className="text-theme-text-muted m-0 text-sm sm:text-base">
          Administrá tu cuenta y preferencias personales.
        </p>
      </header>

      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-bold m-0 text-theme-text">Datos Personales</h2>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-theme-text-muted">
              Email (Solo lectura)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputCls} opacity-70 cursor-not-allowed`}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-theme-text-muted">
              Nombre a mostrar
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Lucas Ramos"
              required
              className={inputCls}
            />
          </div>

          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm border ${
                message.type === "error"
                  ? "bg-theme-danger-light text-theme-danger border-theme-danger"
                  : "bg-theme-success-light text-theme-success border-theme-success"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ProfileSettings: React.FC = () => {
  return (
    <AppShell>
      <ProfileForm />
    </AppShell>
  );
};
