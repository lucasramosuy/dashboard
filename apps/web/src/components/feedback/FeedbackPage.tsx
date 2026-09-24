import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { AppShell } from "../layout/AppShell";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FeedbackSkeleton } from "../ui/Skeleton";
import { logger, toError } from "../../lib/logger";

const FeedbackForm: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
      const error = toError(err);
      logger.error("[FeedbackPage] Error al enviar feedback a Sentry:", error);
      setStatus("error");
    }
  };

  if (authLoading) {
    return <FeedbackSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col gap-1 mb-2">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight text-theme-text">Reportar un problema</h1>
        <p className="text-theme-text-muted m-0 text-sm sm:text-base">
          Ayudanos a mejorar reportando problemas o sugiriendo nuevas ideas.
        </p>
      </header>
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
          <Button variant="secondary" onClick={() => setStatus("idle")} className="mt-4">
            Enviar otro reporte
          </Button>
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

          <Input
            id="name"
            label="Nombre (Opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "submitting"}
          />

          <Input
            id="email"
            type="email"
            label="Correo electrónico (Opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-theme-text mb-1">
              Descripción del Bug / Comentario <span className="text-theme-danger">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el problema que encontraste o tu sugerencia..."
              required
              disabled={status === "submitting"}
              rows={5}
              className="w-full p-4 rounded-lg border border-theme-border bg-theme-bg text-theme-text text-base outline-none resize-vertical min-h-40 focus:border-theme-primary transition-all focus:ring-2 focus:ring-theme-primary/10 disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={status === "submitting"}
            disabled={!message.trim()}
            className="w-full"
          >
            Enviar Reporte
          </Button>
        </form>
      )}
    </div>
  );
};

export const FeedbackPage: React.FC = () => {
  return (
    <AppShell>
      <FeedbackForm />
    </AppShell>
  );
};
