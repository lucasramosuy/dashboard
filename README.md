# Dashboard

Dashboard académico para gestión de materias, tareas, inasistencias, diario de práctica y analíticas.

## Estructura del proyecto

```
dashboard/
├── apps/
│   ├── api/          # Backend — Hono + Bun + SQLite/Turso
│   └── web/          # Frontend — Astro + React
├── packages/
│   └── shared-types/ # Tipos compartidos entre API y Web
├── package.json      # Workspace root (Bun workspaces)
└── ROADMAP.md        # Plan de desarrollo por fases
```

## Requisitos

- [Bun](https://bun.sh/) >= 1.0

## Setup

```bash
# 1. Clonar el repositorio
git clone git@github.com:<usuario>/<repo>.git
cd dashboard

# 2. Instalar dependencias (desde la raíz del monorepo)
bun install

# 3. Configurar variables de entorno
#    Copiar los .env de ejemplo y ajustar los valores:
cp apps/api/.env.example apps/api/.env
#    Variables requeridas en apps/api/.env:
#      JWT_SECRET=<un-secret-seguro>
#      NODE_ENV=development
#    Variables opcionales:
#      TURSO_DATABASE_URL=<url-turso>  (si no se define, usa SQLite local)
#      TURSO_AUTH_TOKEN=<token-turso>
#      DEV_LOGIN_ENABLED=true          (habilita login demo en dev)
#      CORS_ORIGINS=http://localhost:4321

# 4. (Opcional) Seed de datos demo
cd apps/api && bun run seed
cd ../..

# 5. Levantar el entorno de desarrollo
bun run dev
```

Esto levanta:
- **API** en `http://localhost:8787`
- **Web** en `http://localhost:4321`

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `bun run dev` | Levanta API + Web en paralelo |
| `bun run dev:api` | Solo la API |
| `bun run dev:web` | Solo el frontend |
| `bun run build` | Build de producción (API + Web) |
| `bun run test` | Ejecuta tests de la API |
| `bun run test:watch` | Tests en modo watch |
| `bun run format` | Formatea el código con Prettier |
| `bun run lint` | Lint con ESLint |
| `bun run check` | Lint + type-check completo |

## Tests

```bash
bun run test
```

## Sistema de invites

El registro de usuarios requiere un código de invitación de un solo uso. Para generar invites:

```bash
cd apps/api && bun run invites
```

Máximo 10 invites activos simultáneamente.

## Tecnologías

- **Backend:** [Hono](https://hono.dev/) + [Bun](https://bun.sh/) + SQLite / [Turso](https://turso.tech/)
- **Frontend:** [Astro](https://astro.build/) + [React](https://react.dev/)
- **Auth:** JWT propio (sin dependencias externas de auth)
- **Monorepo:** Bun workspaces
