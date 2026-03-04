import React, { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "../contexts/AuthContext";
import { authClient } from "../lib/auth-client";

const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const { error } = await authClient.updateUser({
      name: name.trim(),
    });

    if (error) {
      setMessage({ type: "error", text: error.message || "Error al actualizar perfil" });
    } else {
      setMessage({ type: "success", text: "Datos actualizados correctamente" });
      setTimeout(() => setMessage(null), 3000);
    }

    setIsSaving(false);
  };

  if (!user)
    return (
      <div className="oat-card">
        <p>Cargando información del perfil...</p>
      </div>
    );

  return (
    <div className="oat-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2 className="oat-text-bold" style={{ fontSize: "1.25rem", margin: 0 }}>
        Datos Personales
      </h2>

      <form
        onSubmit={handleUpdate}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div className="login-field">
          <label>Email (Solo lectura)</label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          />
        </div>

        <div className="login-field">
          <label>Nombre a mostrar</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Lucas Ramos"
            required
          />
        </div>

        {message && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              background:
                message.type === "error" ? "rgba(255, 68, 68, 0.1)" : "rgba(76, 175, 80, 0.1)",
              color: message.type === "error" ? "var(--oat-danger)" : "var(--oat-success)",
              border: `1px solid ${message.type === "error" ? "var(--oat-danger)" : "var(--oat-success)"}`,
              fontSize: "0.875rem",
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="login-btn oat-text-bold"
          disabled={isSaving || !name.trim()}
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
};

export const ProfileSettings: React.FC = () => {
  return (
    <AuthProvider>
      <ProfileForm />
    </AuthProvider>
  );
};
