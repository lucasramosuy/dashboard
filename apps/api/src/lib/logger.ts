import * as Sentry from "@sentry/bun";

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
    if (!isProd) {
      console.debug("[DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (!isProd) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);

    // En producción delega automáticamente a Sentry
    if (isProd) {
      const err = args.length > 0 ? toError(args[0]) : new Error("Log de error sin argumentos");
      Sentry.captureException(err, {
        extra: { additionalArgs: args.slice(1) },
      });
    }
  },
};
