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
| `SENTRY_DSN`                              | Opcional, errores a Sentry                               |

Web (`apps/web/.env`, todo opcional en dev; las variables del runtime de Workers van en `apps/web/.dev.vars`, ver Hosting):

| Variable            | Uso                                                     |
| ------------------- | ------------------------------------------------------- |
| `PUBLIC_SENTRY_DSN` | Sentry en el navegador                                  |
| `SENTRY_AUTH_TOKEN` | Subida de source maps a Sentry en el build              |
| `PUBLIC_AGENTATION` | `true` para mostrar el overlay de Agentation (solo dev) |

## Registro con invitación

El registro es **solo con código de invitación** de un solo uso (`POST /api/auth/register`). El sign-up público de Better Auth (`/api/auth/sign-up/*`) está bloqueado y devuelve 403.

Para generar códigos (máximo 10 activos a la vez):

```bash
cd apps/api && bun run invites
```

### Contraseñas

Las contraseñas se guardan con **PBKDF2-SHA256** (WebCrypto, 30.000 iteraciones, salt aleatoria) en `apps/api/src/lib/password.ts`, en lugar del scrypt por defecto de Better Auth: scrypt usa 70-160 ms de CPU y el plan gratuito de Cloudflare Workers da 10 ms por request. Los hashes scrypt viejos se siguen aceptando y se re-guardan solos en PBKDF2 en el primer login correcto.

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

Web y API corren en un solo **Cloudflare Worker** (plan free) en `lucasramos.uy/dashboard`, en el mismo origen:

- `apps/web/src/worker.ts` es la entrada. `/dashboard/api/*` va a la app de Hono (`apps/api/src/app.ts`); el resto lo sirve Astro (`@astrojs/cloudflare`, `base: "/dashboard"`).
- La ruta `lucasramos.uy/dashboard*` (en `apps/web/wrangler.jsonc`) es más específica que la del Worker proxy del dominio, así que Cloudflare la resuelve primero.
- Base: **Turso** (plan free). `bun run migrate` en `apps/api` crea o actualiza las tablas.
- Sync del iCal: Cron Trigger diario a las 03:00 UTC (00:00 de Montevideo).
- Errores: `@sentry/cloudflare`.
- Límite a tener en cuenta: 10 ms de CPU por request en el plan free. Por eso las contraseñas usan PBKDF2 y el iCal un parser propio.

### Deploy

`.github/workflows/deploy.yml` corre en cada push a `prod` (o a mano desde Actions): migra Turso, hace el build y publica con wrangler. Secrets del repo que necesita:

| Secret                  | Para qué                                  |
| ----------------------- | ----------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Publicar el Worker                        |
| `CLOUDFLARE_ACCOUNT_ID` | Cuenta de Cloudflare                      |
| `TURSO_DATABASE_URL`    | Base (se sube como secret del Worker)     |
| `TURSO_AUTH_TOKEN`      | Base (se sube como secret del Worker)     |
| `BETTER_AUTH_SECRET`    | Sesiones (se sube como secret del Worker) |
| `SENTRY_AUTH_TOKEN`     | Opcional, sourcemaps                      |

### Desarrollo local con el runtime de Workers

`bun run dev` sigue siendo la forma normal (API en Bun + Astro). Para probar el Worker tal como corre en producción:

```bash
cd apps/web && cp .dev.vars.example .dev.vars
bun run build && bunx wrangler dev
```

Con `API_PROXY_URL` en `.dev.vars` la API se reenvía al server de Bun local. Ojo: `wrangler dev` usa el host de la ruta (`lucasramos.uy`) como origen, así que el `CORS_ORIGINS` de la API local tiene que incluirlo.

## Tecnologías

- **Backend:** [Hono](https://hono.dev/), [Bun](https://bun.sh/), [libSQL](https://github.com/tursodatabase/libsql-client-ts) / [Turso](https://turso.tech/)
- **Frontend:** [Astro](https://astro.build/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/), [lucide](https://lucide.dev/)
- **Auth:** [Better Auth](https://www.better-auth.com/), con sesiones en cookies HTTP-only
- **Tipografía:** Inter y JetBrains Mono, servidas desde el propio sitio vía Fontsource
- **Errores:** Sentry
