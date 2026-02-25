import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();

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
      await login(email, password);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas. Verificá tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oat-card login-card">
      <div className="login-logo">
        <span>📚</span>
      </div>
      <h1 className="login-title">Iniciar Sesión</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="login-field">
          <label htmlFor="email" className="login-label">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="oat-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@ejemplo.com"
            disabled={loading}
          />
        </div>

        <div className="login-field">
          <label htmlFor="password" className="login-label">
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
            disabled={loading}
          />
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="oat-btn oat-btn-primary login-submit"
        >
          {loading ? (
            <>
              <span className="oat-spinner oat-spinner--sm" />
              Iniciando sesión...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>
    </div>
  );
};
