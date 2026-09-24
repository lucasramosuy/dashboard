import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import type { IcalEvent } from "@dashboard/shared-types";

// Mockear fetch del feed iCal para no hacer requests HTTP reales
const icsDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().replace(/[-:]/g, "").slice(0, 15) +
  "Z";
const MOCK_ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:mock-event-1",
  `DTSTART:${icsDate(1)}`, // Mañana
  "SUMMARY:Clase de prueba",
  "DESCRIPTION:Esta es una clase mockeada - Link: https://zoom.us/mock",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:mock-event-past",
  `DTSTART:${icsDate(-1)}`, // Ayer
  "SUMMARY:Clase antigua (debe ser ignorada si es muy vieja\\, pero acá es reciente)",
  "DESCRIPTION:Otra clase",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:mock-event-old",
  `DTSTART:${icsDate(-60)}`, // Hace 60 días: se descarta
  "SUMMARY:Clase muy vieja",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const realFetch = globalThis.fetch;
globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
  const [input] = args;
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://mock.url.com")) return new Response(MOCK_ICS);
  return realFetch(...args);
}) as typeof fetch;

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

    // 2. Sincronizar (usará el fetch mockeado)
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
