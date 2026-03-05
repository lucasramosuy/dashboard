import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Bug, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth, AuthProvider } from "../contexts/AuthContext";

const FeedbackForm: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && !name) setName(user.name || "");
    if (user && !email) setEmail(user.email || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setStatus("submitting");

    try {
      // Intentamos capturar el feedback con el método nativo de Sentry
      Sentry.captureFeedback({
        message,
        name: name || "Anonymous",
        email: email || "no-reply@test.com",
      });

      setStatus("success");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[600px] mx-auto w-full p-8 text-center text-theme-text-muted">
        Cargando formulario...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-[600px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-theme-text">
          <Bug size={32} className="text-theme-primary" />
          Reportar un Bug
        </h1>
        <p className="text-theme-text-muted mt-2 text-lg">
          ¿Encontraste algún problema? Cuéntanos qué pasó para que podamos arreglarlo. Los reportes
          se envían directamente a nuestro sistema de diagnóstico.
        </p>
      </div>

      {status === "success" ? (
        <div className="bg-theme-success/10 border border-theme-success/20 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-theme-success" />
          <div>
            <h3 className="text-xl font-semibold text-theme-success m-0">
              ¡Gracias por tu reporte!
            </h3>
            <p className="text-theme-text-muted mt-2">
              Hemos recibido tu mensaje y lo revisaremos lo antes posible.
            </p>
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 bg-theme-card-bg border border-theme-border text-theme-text px-4 py-2 rounded-lg cursor-pointer font-medium hover:bg-theme-bg transition-colors"
          >
            Enviar otro reporte
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-theme-card-bg border border-theme-border rounded-2xl p-8 flex flex-col gap-6 transition-all"
        >
          {status === "error" && (
            <div className="bg-theme-error/10 border border-theme-error/20 text-theme-error p-4 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="text-[0.95rem]">
                Hubo un error al enviar el reporte. Por favor intenta de nuevo.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-theme-text">
              Nombre (Opcional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              disabled={status === "submitting"}
              className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg text-theme-text text-base outline-none focus:border-theme-primary transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-theme-text">
              Correo electrónico (Opcional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={status === "submitting"}
              className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg text-theme-text text-base outline-none focus:border-theme-primary transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-theme-text">
              Descripción del Bug / Comentario <span className="text-theme-error">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el problema que encontraste..."
              required
              disabled={status === "submitting"}
              rows={5}
              className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg text-theme-text text-base outline-none resize-vertical min-h-[120px] focus:border-theme-primary transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting" || !message.trim()}
            className={`p-3.5 bg-theme-primary text-theme-bg border-none rounded-lg text-lg font-semibold cursor-pointer transition-all flex justify-center items-center gap-2 hover:bg-theme-accent disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {status === "submitting" ? "Enviando..." : "Enviar Reporte"}
          </button>
        </form>
      )}
    </div>
  );
};

export const FeedbackPage: React.FC = () => {
  return (
    <AuthProvider>
      <FeedbackForm />
    </AuthProvider>
  );
};
