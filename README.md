# Dashboard

[![CI](https://github.com/lucasramosuy/dashboard/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/lucasramosuy/dashboard/actions/workflows/ci.yml)
![Codacy Badge](https://app.codacy.com/project/badge/Grade/46d2c2ebddaa45c7aeda299263839fc7)

Dashboard académico para estudiantes de formación docente (CFE): unidades curriculares (UC), tareas y notas, inasistencias con el tope del 75%, planner semanal, diario de práctica, analíticas y sincronización con el calendario de Schoology.

## Qué hace

- **Inicio:** pendientes, próxima entrega, UC en riesgo, promedio, próximas tareas y eventos del calendario.
- **UC:** asistencia por UC. Límite de faltas = 25% de las clases (reglamento CFE); la falta justificada cuenta 0,5. Promedio de notas y tareas pendientes.
- **Tareas:** filtros (pendientes, vencidas, hechas), búsqueda, filtro por UC y nota por tarea.
- **Planner:** vista semanal con tareas y eventos del iCal. Se arrastran tareas entre días.
- **Diario de práctica:** una entrada por día, con la especialidad en texto libre (por ejemplo "Derecho").
- **Analíticas:** asistencia por UC, promedio por UC y entregas por semana.
- **Schoology:** pegás tu enlace privado de calendario (webcal) y los eventos se importan.

## Estructura

```
dashboard/
├── apps/
│   ├── api/            # Backend: Hono + Bun + libSQL (SQLite local / Turso)
│   └── web/            # Frontend: Astro 7 + React 18 + Tailwind 4
├── packages/
│   └── shared-types/   # Tipos y esquemas (zod) compartidos
├── MD/                 # SPECS.md y ROADMAP.md
└── .github/            # CI (GitHub Actions) y Dependabot
```

## Requisitos

- [Bun](https://bun.sh/) 1.4 o superior (el CI usa 1.4.2).

## Setup local

```bash
git clone https://github.com/lucasramosuy/dashboard.git
cd dashboard
bun install

# Variables de entorno: copiar los ejemplos y completar
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env   # opcional en dev

# Datos demo (usuario demo@example.com / demo1234)
cd apps/api && bun run seed && cd ../..

bun run dev
```

Levanta la API en `http://localhost:8787` y la web en `http://localhost:4321`.

## Variables de entorno

API (`apps/api/.env`):

| Variable                                  | Uso                                                      |
| ----------------------------------------- | -------------------------------------------------------- |
| `NODE_ENV`                                | `development`, `test` o `production`                     |
| `BETTER_AUTH_URL`                         | URL pública de la API (en dev `http://localhost:8787`)   |
| `BETTER_AUTH_SECRET`                      | Secreto de sesiones (32+ caracteres)                     |
| `CORS_ORIGINS`                            | Orígenes permitidos, separados por coma                  |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Base en Turso. Si no están, usa SQLite local             |
| `DATABASE_PATH`                           | Ruta del SQLite local (default `./data/database.sqlite`) |
| `SENTRY_BUN_DSN` / `SENTRY_HONO_DSN`      | Opcionales, errores a Sentry                             |

Web (`apps/web/.env`, todo opcional en dev):

| Variable                 | Uso                                                       |
| ------------------------ | --------------------------------------------------------- |
| `PUBLIC_API_BASE`        | URL de la API si no está en el mismo origen               |
| `PUBLIC_FRONTEND_ORIGIN` | Origen público del frontend (validación de sesión en SSR) |
| `PUBLIC_SENTRY_DSN`      | Sentry en el navegador                                    |
| `SENTRY_AUTH_TOKEN`      | Subida de source maps a Sentry en el build                |
| `PUBLIC_AGENTATION`      | `true` para mostrar el overlay de Agentation (solo dev)   |

## Registro con invitación

El registro es **solo con código de invitación** de un solo uso (`POST /api/auth/register`). El sign-up público de Better Auth (`/api/auth/sign-up/*`) está bloqueado y devuelve 403.

Para generar códigos (máximo 10 activos a la vez):

```bash
cd apps/api && bun run invites
```

### Contraseñas

Las contraseñas se guardan con **PBKDF2-SHA256** (WebCrypto, 30.000 iteraciones, salt aleatoria) en `apps/api/src/lib/password.ts`, en lugar del scrypt por defecto de Better Auth: scrypt usa 70-160 ms de CPU y el plan gratuito de Cloudflare Workers da 10 ms por request. Los hashes scrypt viejos se siguen aceptando.

Para cambiarle la contraseña a un usuario (pide la contraseña nueva por la terminal; con las variables de Turso apunta a producción):

```bash
cd apps/api && bun run set-password <email>
```

## Schoology (iCal)

- El enlace se guarda en el usuario (`ical_url`) desde la pantalla **Schoology**.
- Se sincroniza al tocar **Sincronizar** y una vez por día a las 00:00 (Montevideo), con un cron dentro de la API.
- El feed se parsea con un parser propio y liviano (`apps/api/src/lib/ics.ts`, sin `node-ical`): fechas UTC, con `TZID`, flotantes (se toman como hora de Montevideo) y de día completo. No expande `RRULE`.
- Cada sincronización reemplaza los eventos del usuario (tabla `ical_events`). Descarta los de hace más de 30 días.
- Los eventos se muestran en Inicio (próximos 7 días), en el Planner y en Schoology. No se convierten en tareas.

## Scripts

| Comando           | Qué hace                                       |
| ----------------- | ---------------------------------------------- |
| `bun run dev`     | API + web en paralelo                          |
| `bun run dev:api` | Solo la API                                    |
| `bun run dev:web` | Solo la web                                    |
| `bun run build`   | Build de producción (API + web)                |
| `bun run test`    | Tests de la API (`bun test`)                   |
| `bun run lint`    | ESLint                                         |
| `bun run check`   | Lint + tsc de la API + `astro check` de la web |
| `bun run format`  | Prettier                                       |

## Ramas y PRs

- `dev` es la rama por defecto. `prod` es lo que está publicado.
- Cada cambio va en una rama `feat/*`, `fix/*`, `chore/*` o `docs/*`, con PR contra `dev`. Se mergea con **Squash and merge**.
- Para publicar, se abre un PR `dev` → `prod`.
- **CI** (GitHub Actions, `.github/workflows/ci.yml`): corre en cada push a `dev` y en cada PR a `dev` o `prod`. Hace tests de la API, lint, type check y build de la web.
- **Dependabot** (`.github/dependabot.yml`): una vez por semana (lunes). Agrupa las actualizaciones menores en un solo PR contra `dev`. Los saltos mayores se hacen a mano.

## Hosting

Hoy el deploy está pensado para Render (`render.yaml` y Dockerfiles). La migración planeada es a **Cloudflare Workers** en `lucasramos.uy/dashboard` (web y API en el mismo origen, a través del Worker proxy), con base en **Turso** (plan free) y deploy por GitHub Actions desde `prod`. Ver `MD/ROADMAP.md`, Fase 16.

## Tecnologías

- **Backend:** [Hono](https://hono.dev/), [Bun](https://bun.sh/), [libSQL](https://github.com/tursodatabase/libsql-client-ts) / [Turso](https://turso.tech/)
- **Frontend:** [Astro](https://astro.build/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/), [lucide](https://lucide.dev/)
- **Auth:** [Better Auth](https://www.better-auth.com/), con sesiones en cookies HTTP-only
- **Tipografía:** Inter y JetBrains Mono, servidas desde el propio sitio vía Fontsource
- **Errores:** Sentry
