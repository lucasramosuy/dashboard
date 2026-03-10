import { describe, it, expect, beforeEach, mock } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import type { IcalEvent } from "@dashboard/shared-types";
import { icalService } from "../src/services/icalService";

// Mockear node-ical para devolver un VEVENT falso sin hacer requests HTTP
mock.module("node-ical", () => {
  return {
    default: {
      async: {
        fromURL: async () => {
          return {
            "mock-event-1": {
              type: "VEVENT",
              summary: "Clase de prueba",
              description: "Esta es una clase mockeada - Link: https://zoom.us/mock",
              start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Mañana
            },
            "mock-event-past": {
              type: "VEVENT",
              summary: "Clase antigua (debe ser ignorada si es muy vieja, pero acá es reciente)",
              description: "Otra clase",
              start: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ayer
            },
          };
        },
      },
    },
  };
});

async function getTestCookie(): Promise<{ cookie: string }> {
  const email = `ical-${Date.now()}@test.com`;
  await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test Ical" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "test12345" }),
    headers: { "Content-Type": "application/json" },
  });

  // Extraemos la sesión
  const cookie = res.headers.get("set-cookie") || "";

  return { cookie };
}

describe("iCal Integration API Tests", () => {
  let cookie: string;

  beforeEach(async () => {
    const authData = await getTestCookie();
    cookie = authData.cookie;
  });

  it("PATCH /api/ical/config should update ical_url", async () => {
    const res = await app.request("/api/ical/config", {
      method: "PATCH",
      body: JSON.stringify({ ical_url: "webcal://mock.schoology.com/feed.ics" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.ical_url).toBe("https://mock.schoology.com/feed.ics"); // Debe ser normalizada
  });

  it("POST /api/ical/sync should fail if no url configured", async () => {
    const res = await app.request("/api/ical/sync", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(400); // Bad Request porque no hay URL
    const body: any = await res.json();
    expect(body.error).toContain("Aún no se ha configurado la URL");
  });

  it("POST /api/ical/sync should sync events if url is configured", async () => {
    // 1. Configurar URL
    await app.request("/api/ical/config", {
      method: "PATCH",
      body: JSON.stringify({ ical_url: "https://mock.url.com" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    // 2. Sincronizar (usará el mock de node-ical)
    const res = await app.request("/api/ical/sync", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedCount).toBe(2); // Retorna los 2 eventos mockeados
  });

  it("GET /api/ical/events should return synced events", async () => {
    // 1. Configurar URL y sincronizar
    await app.request("/api/ical/config", {
      method: "PATCH",
      body: JSON.stringify({ ical_url: "https://mock.url.com" }),
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });
    await app.request("/api/ical/sync", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    // 2. Obtener eventos
    const res = await app.request("/api/ical/events", {
      method: "GET",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as IcalEvent[];

    expect(body.length).toBe(2);
    expect(body[0].title).toBe(
      "Clase antigua (debe ser ignorada si es muy vieja, pero acá es reciente)",
    );
    expect(body[1].title).toBe("Clase de prueba");
    expect(body[1].url).toBe("https://zoom.us/mock"); // Parseó el link
  });
});

describe("iCal Service Tests", () => {
  it("syncUserCalendar should throw if no url is provided", async () => {
    await expect(icalService.syncUserCalendar("user-id", "")).rejects.toThrow(
      "El usuario no tiene una URL de iCal configurada.",
    );
  });
});
