# SPECS.md – Dashboard

## 1. Objetivo general

Migrar el proyecto Dashboard desde Zo.space a una arquitectura basada en:

- Repositorio en GitHub (monorepo).
- Backend con Bun + Hono (APIs REST).
- Frontend con Astro + React + Tailwind CSS (UI personalizable mediante utilidades, build vía Vite).
- Hosting gratis: un Cloudflare Worker en `lucasramos.uy/dashboard` (web + API en el mismo origen) con Turso (ver sección 3).
- Uso de un AI coding assistant en CLI (Gemini Code Assist / Gemini CLI) para apoyar el desarrollo con una capa gratuita generosa.

La meta es tener un entorno reproducible, documentado y sin dependencias en configuraciones internas de Zo.

---

## 2. Repositorio y estructura

Repositorio:

Estructura propuesta (monorepo):

/
├─ apps/
│ ├─ web/ # Astro + React (frontend) y entrada del Worker (src/worker.ts, wrangler.jsonc)
│ └─ api/ # Hono (backend): app.ts sin runtime, server.ts para Bun en local
├─ packages/
│ └─ shared-types/ # Tipos TypeScript compartidos (Subject, Task, Practice, etc.)
├─ .github/workflows/ # CI y deploy a Cloudflare
├─ .gitignore
├─ package.json # Scripts de orquestación (Bun workspaces)
└─ README.md

---

## 2.1. apps/web (Astro + React + Tailwind CSS)

- Framework: Astro con integración de React para las partes interactivas.
- UI library: Tailwind CSS (sistema de utilidades utilitarias).
- Build tool: Vite (default de Astro).
- Lenguaje: TypeScript.

### UI con Tailwind CSS

El proyecto hace uso de Tailwind CSS como core de diseño.
Componentes UI se construirán desde la base usando React y utilidades de Tailwind en `apps/web/src/components/ui`.

Estilos

- Aprovechar `className` en lugar de estilos `.css` globales en la mayor cantidad de situaciones posibles.
- Utilizar el set de directivas estándar (`@tailwind base; @tailwind components; @tailwind utilities`) en `src/styles/theme.css`.

Componentes dinámicos

- Construir componentes propios para modales, formularios y navegación con React y abstracciones como `@radix-ui/react-dialog` si amerita complejidad de A11y.
- Mantener React solo donde se necesite estado complejo, utilizando `@tanstack/react-query` y hooks para aislar responsabilidades (Container-Presenter pattern).

### Theming (light/dark) con Tailwind CSS

Tema oscuro: implementar un ThemeContext y hacer uso de las clases `dark:` propias de Tailwind.

document.body.dataset.theme = 'dark' | 'light';

La config de Tailwind en `tailwind.config.mjs` usa: `darkMode: ['class', '[data-theme="dark"]']` de esta forma el `ThemeToggle` actúa automáticamente sin modificar la app entera.

### Rutas y páginas

Rutas principales (según la app actual):

- /login – Página de login.
- / – Dashboard principal.
- /subjects – Lista de UC.
- /subjects/[id] – Detalle de UC (estadísticas, inasistencias, tareas relacionadas).
- /tasks – Gestor de tareas (lista + Kanban).
- /practice – Diario de prácticas.

Layout

- Layout raíz con sidebar colapsable:
  - Navegación: Dashboard, UC, Tareas, Prácticas.
  - Estado de colapso manejado con React (contexto o useState en un componente envolvente).
  - Header o área superior con mensaje de estado general (“Tienes X tareas hoy, Y esta semana, N UC en alerta/peligro”).

### Estados

AuthContext

- Estado: user, isLoading.
- Acciones: login(credentials), logout().
- Usa el cliente de **Better Auth** (`authClient.signIn.email`, `authClient.signOut`) en lugar de fetch directo. Las sesiones se gestionan con HTTP-only cookies.

ThemeContext

- Estado: theme: 'light' | 'dark'.
- Acción: toggleTheme().
- Persiste en localStorage y sincroniza data-theme en <body>.

### Integración con API

Cliente HTTP en `apps/web/src/lib/api.ts`.
Cliente de autenticación en `apps/web/src/lib/auth-client.ts` (Better Auth React client).

Definir API_BASE:

const API_BASE =
import.meta.env.PUBLIC_API_BASE && import.meta.env.PUBLIC_API_BASE.trim() !== ""
? import.meta.env.PUBLIC_API_BASE
: "/api";

En desarrollo, Astro proxyea `/api` → `localhost:8787` (configurado en `astro.config.mjs`).
En producción, `PUBLIC_API_BASE` apunta al backend real.

Exponer métodos tipados:

- Auth: login (vía authClient), logout (vía authClient), register (custom endpoint con invite code).
- Subjects: getSubjects, getSubject(id), getAtRiskSubjects, createSubject, updateSubject, deleteSubject.
- Tasks: getTasks, getTask(id), createTask, updateTask, deleteTask, updateTaskStatus.
- Practice: getJournals, getJournalByDate, upsertJournal.
- Absences: getAbsences(subjectId), getAllAbsences, createAbsence, deleteAbsence.

Tipos abstractos y esquemas de validación (Zod) importados desde `packages/shared-types` para Single Source of Truth full-stack.

---

## 2.2. apps/api (Bun + Hono)

- Runtime: Bun.
- Framework: Hono (API HTTP minimalista, compatible con Bun).
- Lenguaje: TypeScript.

### Endpoints

Rutas (prefijo /api):

Auth (gestionado por **Better Auth**)

- `GET|POST /api/auth/*` — Manejado por Better Auth wildcard handler (login, logout, sesión, etc.).
- `POST /api/auth/register` — Endpoint custom (valida invite code, crea usuario vía Better Auth server-side API).

Subjects

- GET /api/subjects
- GET /api/subjects/:id
- GET /api/subjects/at-risk

Absences

- GET /api/absences?subject_id=...
- POST /api/absences
- DELETE /api/absences/:id

Tasks

- GET /api/tasks
- GET /api/tasks/today
- GET /api/tasks/week
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

Practice

- GET /api/practice
- POST /api/practice
- PUT /api/practice/:id
- DELETE /api/practice/:id

Utilidades

- GET /api/db – Health check / debug.

### Persistencia

Almacenamiento: **SQLite** local en desarrollo, **Turso** (LibSQL) en producción.

Módulo `lib/db.ts` en `apps/api`:

- Usa `@libsql/client` para conectar a SQLite local o Turso según variables de entorno.
- `initDB()`: Inicializa tablas con integridad referencial (`ON DELETE CASCADE`) y claves foráneas activas.
- `dbService`: Capa de abstracción CRUD con conversión automática de tipos (ej. strings ISO de SQLite a objetos `Date` de JS).

Módulo `lib/auth.better.ts` en `apps/api`:

- Usa `Kysely` con `@libsql/kysely-libsql` como adaptador de DB para Better Auth.
- Configura `betterAuth()` con `emailAndPassword`, `trustedOrigins` y `baseURL`.

Esquema de Tablas:

- `user`: id, name, email, emailVerified, image, createdAt, updatedAt (gestionada por Better Auth).
- `session`: id, expiresAt, token, userId, etc. (gestionada por Better Auth).
- `account`: id, accountId, providerId, userId, etc. (gestionada por Better Auth).
- `verification`: id, identifier, value, expiresAt, etc. (gestionada por Better Auth).
- `subjects`: id, name, total_classes, user_id (FK).
- `absences`: id, subject_id (FK), date, type, calculated_value.
- `tasks`: id, subject_id (FK), user_id, title, description, status, due_date, grade.
- `practice_journals`: id, subject_id (texto libre: la especialidad, por ejemplo "Derecho"; no es FK a UC), user_id, date (ISO, medianoche UTC del día local), content. `GET /api/practice-journals?date=YYYY-MM-DD` busca por día.
- `invites`: id, code (UNIQUE), used, created_at.

Config vía env:

- `DATABASE_PATH` con default `./data/database.sqlite` (dev local).
- `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` para producción con Turso.
- `BETTER_AUTH_URL` con default `http://localhost:8787`.

### Auth

Gestionado por **Better Auth** (`lib/auth.better.ts`).

- Sesiones: HTTP-only cookies gestionadas automáticamente por Better Auth.
- Registro: **solo con invite**. Endpoint custom `POST /api/auth/register` que valida el invite code y luego llama a `auth.api.signUpEmail()` internamente. El sign-up público de Better Auth (`/api/auth/sign-up/*`) está bloqueado en `server.ts` (responde 403) y tiene test.
- Login/Logout: manejados por Better Auth wildcard handler.
- Hash de contraseñas: PBKDF2-SHA256 con WebCrypto (`lib/password.ts`, 30.000 iteraciones, formato `pbkdf2$sha256$<iter>$<salt>$<hash>`), configurado en `emailAndPassword.password`. Verifica también los hashes scrypt heredados y los reemplaza por PBKDF2 en el primer login correcto (hook `after` de `/sign-in/email`). Motivo: entrar en los 10 ms de CPU por request de Workers free. Script `bun run set-password <email>` para regenerar una contraseña.

Usuario dev (solo desarrollo):

- Se crea mediante `seed.ts` (`bun run seed`): usuario demo, 2 UC de profesorado, inasistencias y tareas con `user_id`.
- En producción no se corre el seed.

### Lógica de negocio

Inasistencias

- Absence.type: 'standard' | 'justified'.
- calculated_value: 1.0 para standard, 0.5 para justified.

Porcentaje de inasistencias de una UC:

porcentaje = sum(calculated_value) / total_classes \* 100

Estados:

- < 15% → Normal.
- > = 15% y < 20% → En alerta.
- > = 20% → En peligro.

- /api/subjects/at-risk calcula y devuelve solo UC en alerta o peligro.
- /api/tasks/today y /api/tasks/week filtran por fechas (hoy, semana actual) según due_date.

---

## 2.3. packages/shared-types

Paquete TypeScript con tipos compartidos:

- Subject
- Task
- PracticeJournal
- Absence
- User
- Esquemas y Validaciones (Zod schemas universales)

Se publica dentro del monorepo (import local) y se utiliza tanto en apps/api como en apps/web para garantizar consistencia total en interfaces y contratos de red.

---

## 3. Hosting y despliegue

Un solo Cloudflare Worker (plan free) en `https://lucasramos.uy/dashboard`:

- Entrada: `apps/web/src/worker.ts`. `/dashboard/api/*` va a Hono (`apps/api/src/app.ts`, se le saca el prefijo `/dashboard`); el resto lo sirve Astro con `@astrojs/cloudflare` y `base: "/dashboard"`.
- Mismo origen: sin CORS ni cookies cross-domain. El middleware SSR valida la sesión llamando a la API en proceso.
- Ruta `lucasramos.uy/dashboard*` en `apps/web/wrangler.jsonc`, más específica que la del Worker proxy del dominio.
- Base: Turso. Variables del Worker: `NODE_ENV`, `BETTER_AUTH_URL=https://lucasramos.uy`, `CORS_ORIGINS=https://lucasramos.uy` (en `wrangler.jsonc`); secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, opcional `SENTRY_DSN`.
- Cron Trigger `0 3 * * *` (00:00 Montevideo): sync del iCal de todos los usuarios, de a uno.
- Límite free: 10 ms de CPU por request. PBKDF2 30k (4-12 ms medido) y parser iCal propio.
- Deploy: `.github/workflows/deploy.yml` en push a `prod`.

---

## 4. Flujo de desarrollo

### 4.1. Local

Requisitos:

- bun instalado.
- Git.

Scripts recomendados (en package.json raíz):

{
"scripts": {
"dev:web": "cd apps/web && bun run dev",
"dev:api": "cd apps/api && bun run dev",
"dev": "bunx concurrently \"bun run dev:web\" \"bun run dev:api\""
}
}

apps/web

- Astro dev server, p. ej. http://localhost:4321.

apps/api

- Hono + Bun, p. ej. http://localhost:8787.

Config en el frontend:

- La API se llama siempre en el mismo origen, en `/dashboard/api` (helper `url()` de `lib/utils`).
- En desarrollo, con `API_PROXY_URL` (en `apps/web/.dev.vars`) las llamadas a la API se reenvían al server de Bun (`http://localhost:8787`).

### 4.2. Deploy

1. PR `dev` → `prod`.
2. Al mergear, GitHub Actions migra Turso, hace el build y publica el Worker.
3. Verificar login y dashboard en `https://lucasramos.uy/dashboard`.

---

## 5. Uso de AI coding assistant (Gemini CLI)

Se busca un flujo “vibecoding” en terminal con una capa gratuita generosa.

- Herramienta recomendada: Gemini Code Assist / Gemini CLI, que ofrece uso individual gratuito y buena capacidad para generación/explicación de código.
- Free tier de la API Gemini: límites razonables diarios y por minuto sin necesidad de tarjeta para modelos como Gemini 2.5 Flash/Pro.

### 5.1. Casos de uso

- Scaffold inicial:
  - Generar boilerplate de Hono + Bun.
  - Crear proyecto Astro + React + Oat.
- Configuración:
  - Ayuda para Dockerfile de Bun, render.yaml, scripts de Bun.
  - Adaptar los endpoints existentes a Hono.
- Refactors y documentación:
  - Convertir lógica de Zo Space en handlers Hono.
  - Generar tipos en packages/shared-types.
  - Redactar README y docs internas.

### 5.2. Reglas de uso

- SPECS.md es la fuente de verdad: cualquier cambio arquitectónico sugerido por la IA debe reflejarse aquí si se acepta.
- Usar la IA para código repetitivo y configuración, no para decisiones críticas sin revisión manual.

---

## 6. Backlog inicial de migración

Repo & estructura

- Crear repo GitHub.
- Crear carpetas /apps/web, /apps/api, /packages/shared-types.
- Añadir SPECS.md y README inicial.

Backend Bun + Hono

- Scaffold server Hono con Bun.
- Implementar lib/db.ts con lectura/escritura JSON.
- Portar endpoints /api/\* desde Zo.
- Implementar auth + usuario demo.

Frontend Astro + React + Tailwind CSS

- Scaffold proyecto Astro.
- Integrar Tailwind CSS y configurar modo oscuro por selector `data-theme`.
- Implementar ThemeContext y AuthContext.
- Portar páginas: Dashboard, Subjects, SubjectDetail, Tasks, Practice, Login.

Integración

- Configurar API_BASE y probar flujo end-to-end local.
- Sembrar datos demo en JSON.

Hosting

- Publicar el Worker en Cloudflare con GitHub Actions.
- Validar login y dashboard en entorno remoto.

Limpieza & docs

- Actualizar README con instrucciones de setup, dev y deploy.
- Mantener SPECS.md al día ante cualquier cambio estructural.
