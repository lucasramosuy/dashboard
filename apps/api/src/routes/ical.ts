import { Hono } from "hono";
import { auth } from "../lib/auth.better";
import { db, dbService } from "../lib/db";
import { updateIcalSchema } from "@dashboard/shared-types";
import { icalService } from "../services/icalService";

type Variables = {
  user: typeof auth.$Infer.Session.user;
};

const icalRouter = new Hono<{ Variables: Variables }>();

// Middleware auth
icalRouter.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ error: "No autorizado" }, 401);
  }
  c.set("user", session.user as any); // Tipado flojo para acelerar
  await next();
});

// PATCH /api/ical/config
// Normaliza y guarda el feed URL del calendario.
icalRouter.patch("/config", async (c) => {
  const user = c.get("user");
  const body = updateIcalSchema.parse(await c.req.json());

  if (body.ical_url !== undefined) {
    await db.execute({
      sql: "UPDATE user SET ical_url = ? WHERE id = ?",
      args: [body.ical_url, user.id],
    });
  }

  return c.json({ success: true, ical_url: body.ical_url });
});

// POST /api/ical/sync
// Descarga el feed y lo guarda como tareas en un subject virtual
icalRouter.post("/sync", async (c) => {
  const user = c.get("user");

  const r = await db.execute({
    sql: "SELECT ical_url FROM user WHERE id = ?",
    args: [user.id],
  });

  const ical_url = (r.rows[0]?.ical_url as string) || "";

  if (!ical_url) {
    return c.json({ error: "Aún no se ha configurado la URL de iCal para el usuario." }, 400);
  }

  const result = await icalService.syncUserCalendar(user.id, ical_url);
  return c.json(result);
});

// GET /api/ical/events
// Devuelve todas los eventos sincronizados desde Schoology (iCal)
icalRouter.get("/events", async (c) => {
  const user = c.get("user");
  const events = await dbService.icalEvents.getByUser(user.id);
  return c.json(events);
});

export { icalRouter };
