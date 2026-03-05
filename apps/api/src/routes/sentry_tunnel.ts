import { Hono } from "hono";

/**
 * Sentry Tunneling
 * Evita que los ad-blockers bloqueen los reportes de Sentry
 * enviándolos a través de nuestro propio dominio.
 */
const sentryTunnelRouter = new Hono();

sentryTunnelRouter.post("/tunnel", async (c) => {
  try {
    const envelope = await c.req.text();
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);

    if (!header.dsn) {
      return c.json({ error: "Missing DSN in envelope header" }, 400);
    }

    const dsn = new globalThis.URL(header.dsn);
    const projectId = dsn.pathname.replace("/", "");

    // Validación de seguridad: solo permitimos nuestro proyecto de Sentry
    // DSN del frontend: ...o4510988275482624.ingest.us.sentry.io/4510988282822656
    const allowedProjectIds = ["4510988282822656"];

    if (!allowedProjectIds.includes(projectId)) {
      return c.json({ error: `Invalid Project ID: ${projectId}` }, 400);
    }

    const sentryUrl = `https://${dsn.host}/api/${projectId}/envelope/`;

    const response = await fetch(sentryUrl, {
      method: "POST",
      body: envelope,
    });

    return c.newResponse(response.body, response.status as any);
  } catch (error) {
    console.error("[Sentry Tunnel Error]", error);
    return c.json({ error: "Internal Tunnel Error" }, 500);
  }
});

export { sentryTunnelRouter };
