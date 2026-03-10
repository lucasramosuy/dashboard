import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { logger } from "../lib/logger";

/**
 * Sentry Tunneling
 * Evita que los ad-blockers bloqueen los reportes de Sentry
 * enviándolos a través de nuestro propio dominio.
 *
 * El SDK envía un "envelope" cuya primera línea es un JSON con el DSN.
 * Parseamos ese DSN, validamos host + project ID, y reenviamos
 * el body completo al endpoint real de Sentry.
 *
 * Ref: https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
 */
const sentryTunnelRouter = new Hono();

// Solo aceptamos envelopes destinados a nuestro org en Sentry
const SENTRY_HOST = "o4510988275482624.ingest.us.sentry.io";

// Project IDs permitidos — el del frontend (Astro)
const KNOWN_PROJECT_IDS = new Set(["4510988282822656"]);

sentryTunnelRouter.post("/", async (c) => {
  try {
    // Leemos el body como texto plano (formato envelope)
    const envelope = await c.req.text();
    const headerLine = envelope.split("\n")[0];

    if (!headerLine) {
      return c.text("Empty envelope", 400);
    }

    const header = JSON.parse(headerLine);

    if (!header.dsn) {
      return c.text("Missing DSN in envelope header", 400);
    }

    const dsn = new URL(header.dsn);
    const projectId = dsn.pathname.replace("/", "");

    // Validación de host
    if (dsn.hostname !== SENTRY_HOST) {
      logger.warn(`[sentry_tunnel] Host no autorizado: ${dsn.hostname}`);
      return c.text("Invalid Sentry host", 403);
    }

    // Validación de project ID
    if (!KNOWN_PROJECT_IDS.has(projectId)) {
      logger.warn(`[sentry_tunnel] Project ID no autorizado: ${projectId}`);
      return c.text("Invalid project", 403);
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;

    // Reenviamos el envelope completo sin modificar headers
    const sentryResponse = await fetch(upstreamUrl, {
      method: "POST",
      body: envelope,
    });

    // Propagamos el status de Sentry al cliente
    return c.body(null, sentryResponse.status as StatusCode);
  } catch (error) {
    logger.error("[sentry_tunnel] Error en proxy:", error);
    return c.text("Tunnel error", 500);
  }
});

export { sentryTunnelRouter };
