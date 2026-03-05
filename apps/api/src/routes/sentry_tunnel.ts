import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";

/**
 * Sentry Tunneling
 * Evita que los ad-blockers bloqueen los reportes de Sentry
 * enviándolos a través de nuestro propio dominio.
 */
const sentryTunnelRouter = new Hono();

sentryTunnelRouter.post("/", async (c) => {
  try {
    const envelope = await c.req.text();
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);

    const dsn = new globalThis.URL(header.dsn);
    const projectId = dsn.pathname.replace("/", "");

    // Validación estricta de seguridad: solo permitimos nuestro host de Sentry
    const SENTRY_HOST = "o4510988275482624.ingest.us.sentry.io";

    if (dsn.host !== SENTRY_HOST) {
      return c.text("Host DSN no autorizado", 403);
    }

    const sentryUrl = `https://${dsn.host}/api/${projectId}/envelope/`;

    const sentryResponse = await fetch(sentryUrl, {
      method: "POST",
      body: envelope,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });

    return c.body(null, sentryResponse.status as StatusCode);
  } catch (error) {
    console.error("Fallo en el túnel Sentry:", error);
    return c.text("Fallo en la ejecución del proxy", 500);
  }
});

export { sentryTunnelRouter };
