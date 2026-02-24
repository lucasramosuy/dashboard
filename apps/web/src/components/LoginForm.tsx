import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();

  // Guardia: si el usuario ya está autenticado y no está cargando, redirigir al dashboard
  React.useEffect(() => {
    if (user && !authLoading) {
      window.location.assign("/");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Intentar login. AuthContext ya gestiona la persistencia atómica.
      await login(email, password);

      // Usar href para asegurar recarga limpia y que el estado se lea de disco
      window.location.href = "/";
    } catch (err: any) {
      console.error("[LoginForm Error]:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="oat-card"
      style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
    >
      <h2
        className="oat-text-bold"
        style={{
          fontSize: "1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Iniciar Sesión
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="email"
            className="oat-text-secondary"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="oat-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="password"
            className="oat-text-secondary"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="oat-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "var(--oat-danger-light)",
              color: "var(--oat-danger)",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              border: "1px solid var(--oat-danger)",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="oat-btn oat-btn-primary"
          style={{ width: "100%", padding: "0.75rem" }}
        >
          {loading ? "Iniciando sesión..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
