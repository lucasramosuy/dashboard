# Dashboard API

Backend del dashboard académico.

- **Runtime:** Bun
- **Framework:** Hono
- **Auth:** Better Auth (sesiones HTTP-only cookies)
- **DB:** SQLite (dev) / Turso (prod)

## Scripts

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `bun run dev`     | Servidor de desarrollo (puerto 8787) |
| `bun test`        | Ejecutar tests                       |
| `bun run seed`    | Seed de datos demo                   |
| `bun run invites` | Generar códigos de invitación        |

## Variables de entorno

Ver `src/env.d.ts` para la lista completa de variables soportadas.
