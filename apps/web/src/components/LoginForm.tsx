import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const LoginForm: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (typeof window !== "undefined" && user && !authLoading) {
      window.location.replace("/");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await register({ name, email, password, inviteCode });
      } else {
        await login(email, password);
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Por favor verificá tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oat-card login-card">
      <div className="login-logo">
        <span>📚</span>
      </div>
      <h1 className="login-title">{isRegister ? "Crear Cuenta" : "Iniciar Sesión"}</h1>

      <form onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <div className="login-field">
            <label htmlFor="name" className="login-label">
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              className="oat-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Juan Pérez"
              disabled={loading}
            />
          </div>
        )}

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
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="oat-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        {isRegister && (
          <div className="login-field">
            <label htmlFor="inviteCode" className="login-label">
              Código de Invitación
            </label>
            <input
              id="inviteCode"
              type="text"
              className="oat-input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              placeholder="99EE00AA"
              disabled={loading}
            />
          </div>
        )}

        {error && (
          <div className="c" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password || (isRegister && (!name || !inviteCode))}
          className="oat-btn oat-btn-primary login-submit"
        >
          {loading ? (
            <>
              <span className="oat-spinner oat-spinner--sm" />
              {isRegister ? "Creando cuenta..." : "Iniciando sesión..."}
            </>
          ) : isRegister ? (
            "Registrarse"
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <div className="login-toggle" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="oat-btn oat-btn-ghost"
          style={{ fontSize: "0.9rem" }}
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿Tenes código? Regístrate"}
        </button>
      </div>
    </div>
  );
};
