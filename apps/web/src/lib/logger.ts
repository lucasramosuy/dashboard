import * as Sentry from "@sentry/astro";

export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);

  // Retiene la estructura de objetos planos y previene la pérdida de datos
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
};

export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env?.MODE !== "production") {
      console.debug("[DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (import.meta.env?.MODE !== "production") {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);

    // Despacho condicional a Sentry exclusivo para producción
    if (import.meta.env?.MODE === "production") {
      const err = args.length > 0 ? toError(args[0]) : new Error("Log de error sin argumentos");
      Sentry.captureException(err, {
        extra: { additionalArgs: args.slice(1) },
      });
    }
  },
};
