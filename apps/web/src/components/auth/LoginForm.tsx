import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowUpRight, KeyRound } from "lucide-react";
import { TURNSTILE_SITE_KEY } from "../../lib/captcha";
import "./LoginForm.css";
import { url } from "../../lib/utils";
import { resetCaptcha } from "../../lib/captcha";
import { Turnstile } from "./Turnstile";
import { authClient } from "../../lib/auth-client";
export const LoginForm: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  const [sessionExpired] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("reason") === "session_expired";
  });

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
      window.location.href = url("/");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error. Por favor verificá tus datos.",
      );
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Entrar con passkey: no pasa por el formulario ni por Turnstile (la passkey se
  // verifica con el dispositivo). El backend marca la sesión como "con passkey".
  const handlePasskey = async () => {
    if (loading) return;
    setError(null);
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setError("Este navegador no soporta passkeys. Entrá con tu contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        setError("No se pudo verificar la passkey. Probá de nuevo o entrá con tu contraseña.");
        return;
      }
      window.location.href = url("/");
    } catch {
      setError("No se pudo verificar la passkey. Probá de nuevo o entrá con tu contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-content">
      <p className="login-eyebrow">TU ESPACIO ACADÉMICO</p>
      <h1 className="login-title">
        {isRegister ? (
          <>
            Creá tu <em>cuenta.</em>
          </>
        ) : (
          <>
            Volvé a tu <em>panel.</em>
          </>
        )}
      </h1>
      <p className="login-intro">
        {isRegister
          ? "Tu espacio empieza con un código de invitación."
          : "Tus UC, tareas y prácticas, en un solo lugar."}
      </p>
      {sessionExpired && (
        <p role="alert" className="login-notice">
          Tu sesión expiró. Por favor, iniciá sesión nuevamente.
        </p>
      )}
      <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {isRegister && (
          <div className="login-field">
            <label htmlFor="name">Nombre completo</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegister}
              placeholder="Juan Pérez"
              disabled={loading}
            />
          </div>
        )}
        <div className="login-field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            disabled={loading}
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Tu contraseña"
            disabled={loading}
          />
        </div>
        {isRegister && (
          <div className="login-field">
            <label htmlFor="inviteCode">Código de invitación</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required={isRegister}
              placeholder="99EE00AA"
              disabled={loading}
            />
          </div>
        )}
        {error && (
          <p className="login-notice login-notice--error" role="alert">
            {error}
          </p>
        )}
        <div className="login-security">
          <Turnstile />
        </div>
        {TURNSTILE_SITE_KEY && (
          <p className="login-security-note">La verificación protege el acceso a tu cuenta.</p>
        )}
        <button
          type="submit"
          disabled={loading || !email || !password || (isRegister && (!name || !inviteCode))}
          className="login-submit"
        >
          {loading ? (
            <>
              <span aria-hidden="true" className="login-spinner" />
              {isRegister ? "Creando cuenta..." : "Iniciando sesión..."}
            </>
          ) : (
            <>
              {isRegister ? "Registrarse" : "Entrar"}
              <ArrowUpRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
      {!isRegister && (
        <div className="login-alt">
          <p className="login-alt-label">
            <span>o</span>
          </p>
          <button
            type="button"
            className="login-passkey"
            onClick={handlePasskey}
            disabled={loading}
          >
            <KeyRound size={17} aria-hidden="true" />
            Entrar con passkey
          </button>
          <p className="login-security-note">Huella, cara o PIN del dispositivo. Sin contraseña.</p>
        </div>
      )}
      <p className="login-register">
        {isRegister ? "¿Ya tenés cuenta?" : "¿Tenés código de invitación?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
        >
          {isRegister ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </p>
    </div>
  );
};
