import * as Sentry from "@sentry/astro";

export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);

  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
};

const isProd = import.meta.env.PROD;

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.debug("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (!isProd) console.info("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);

    if (isProd) {
      if (args.length === 0) {
        Sentry.captureException(new Error("Log de error sin argumentos"));
        return;
      }

      // Prioriza la captura de instancias de Error reales para mantener la integridad de la traza
      const errorInstance = args.find((arg) => arg instanceof Error) as Error | undefined;
      const primaryError = errorInstance || toError(args[0]);

      Sentry.captureException(primaryError, {
        extra: { additionalArgs: args.filter((arg) => arg !== primaryError) },
      });
    }
  },
};
