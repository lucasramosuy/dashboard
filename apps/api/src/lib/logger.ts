import * as Sentry from "@sentry/core";

export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);

  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
};

const isProd = process.env.NODE_ENV === "production";

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

      // Busca el primer Error real en los argumentos para preservar el stack trace
      const errorInstance = args.find((arg) => arg instanceof Error) as Error | undefined;
      const primaryError = errorInstance || toError(args[0]);

      Sentry.captureException(primaryError, {
        extra: { additionalArgs: args.filter((arg) => arg !== primaryError) },
      });
    }
  },
};
