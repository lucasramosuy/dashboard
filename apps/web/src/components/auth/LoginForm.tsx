import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Book } from "lucide-react";
import { url } from "../../lib/utils";
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
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="bg-theme-card-bg border border-theme-border rounded-xl p-10 shadow-sm transition-all duration-300 ease-in-out">
      {sessionExpired && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        >
          Tu sesión expiró. Por favor, iniciá sesión nuevamente.
        </div>
      )}
      <div className="flex justify-center text-theme-text mb-4">
        <Book size={40} strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-center m-0 mb-8 text-theme-text">
        {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isRegister ? "max-h-120px opacity-100 mb-5" : "max-h-0 opacity-0 mb-0"
          }`}
        >
          <label htmlFor="name" className="block mb-2 text-sm text-theme-text-muted font-medium">
            Nombre Completo
          </label>
          <input
            id="name"
            type="text"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isRegister}
            placeholder="Juan Pérez"
            disabled={loading}
            tabIndex={isRegister ? 0 : -1}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="email" className="block mb-2 text-sm text-theme-text-muted font-medium">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@ejemplo.com"
            disabled={loading}
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-2 text-sm text-theme-text-muted font-medium"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isRegister ? "max-h-30 opacity-100 mb-5" : "max-h-0 opacity-0 mb-0"
          }`}
        >
          <label
            htmlFor="inviteCode"
            className="block mb-2 text-sm text-theme-text-muted font-medium"
          >
            Código de Invitación
          </label>
          <input
            id="inviteCode"
            type="text"
            className={inputCls}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required={isRegister}
            placeholder="99EE00AA"
            disabled={loading}
            tabIndex={isRegister ? 0 : -1}
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 bg-theme-danger-light text-theme-danger rounded-lg mb-5 text-sm border border-theme-danger"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password || (isRegister && (!name || !inviteCode))}
          className="w-full py-3 mt-2 rounded-lg font-semibold text-base border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-none cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-theme-border border-t-theme-primary rounded-full animate-spin" />
              {isRegister ? "Creando cuenta..." : "Iniciando sesión..."}
            </>
          ) : isRegister ? (
            "Registrarse"
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="bg-transparent border-none text-theme-text-muted text-sm font-medium cursor-pointer hover:text-theme-text transition-colors duration-150 underline-offset-2 hover:underline"
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿Tenes código? Regístrate"}
        </button>
      </div>
    </div>
  );
};
