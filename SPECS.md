# SPECS.md – Dashboard

## 1. Objetivo general

Migrar el proyecto Dashboard desde Zo.space a una arquitectura basada en:

- Repositorio en GitHub (monorepo).
- Backend con Bun + Hono (APIs REST).
- Frontend con Astro + React + Oat (UI ultra‑liviana, build vía Vite).
- Hosting con una capa free generosa (preferencia Render; alternativa Cloudflare Pages + otro backend).
- Uso de un AI coding assistant en CLI (Gemini Code Assist / Gemini CLI) para apoyar el desarrollo con una capa gratuita generosa.

La meta es tener un entorno reproducible, documentado y sin dependencias en configuraciones internas de Zo.

---

## 2. Repositorio y estructura

Repositorio:

Estructura propuesta (monorepo):

/
├─ apps/
│  ├─ web/           # Astro + React + Oat (frontend)
│  └─ api/           # Bun + Hono (backend)
├─ packages/
│  └─ shared-types/  # Tipos TypeScript compartidos (Subject, Task, Practice, etc.)
├─ infra/            # Configs de deploy (render.yaml, dockerfiles opcionales)
├─ .editorconfig
├─ .gitignore
├─ package.json      # Scripts de orquestación (opcional, puede ser solo Bun)
└─ README.md

---

## 2.1. apps/web (Astro + React + Oat)

- Framework: Astro con integración de React para las partes interactivas.
- UI library: Oat (ultra-lightweight UI en HTML+CSS+JS vanilla).
- Build tool: Vite (default de Astro).
- Lenguaje: TypeScript.

### UI con Oat

Inclusión en layout raíz de Astro (`src/layouts/Base.astro` o equivalente):

<head>
  <!-- ... meta, title ... -->
  <link rel="stylesheet" href="https://unpkg.com/@oat/ui/dist/oat.css">
  <script type="module" src="https://unpkg.com/@oat/ui/dist/oat.js"></script>
</head>

(Opcional: copiar esos assets al proyecto y servirlos localmente en producción).

Estilos
- Usar mayormente elementos HTML nativos (<button>, <input>, <nav>, <section>, <dialog>, etc.), ya que Oat los estiliza automáticamente sin clases adicionales.
- Para ajustes finos, sobrescribir variables CSS de Oat en un archivo global (`src/styles/theme.css`) cargado después del CSS de Oat.

Componentes dinámicos
- Utilizar los Web Components y JS mínimo que ofrece Oat para elementos como diálogos, menús, etc.
- Mantener React solo donde se necesite estado complejo: tablas con filtros, vistas Kanban, formularios modales, etc.

### Theming (light/dark) con Oat

Tema oscuro: implementar un ThemeContext similar al actual, pero donde la acción principal sea cambiar un atributo:

document.body.dataset.theme = 'dark' | 'light';

Oat soporta theming mediante `data-theme="dark"` en el <body> y variables CSS.
Personalización: ajustar paleta y contrastes redefiniendo variables como `--oat-color-bg`, `--oat-color-fg`, etc., para acercar el diseño al dashboard original, sin recrear todo el sistema de diseño.

### Rutas y páginas

Rutas principales (según la app actual):

- /login – Página de login.
- / – Dashboard principal.
- /subjects – Lista de materias/UC.
- /subjects/[id] – Detalle de materia (estadísticas, inasistencias, tareas relacionadas).
- /tasks – Gestor de tareas (lista + Kanban).
- /practice – Diario de prácticas.

Layout
- Layout raíz con sidebar colapsable:
  - Navegación: Dashboard, Materias, Tareas, Prácticas.
  - Estado de colapso manejado con React (contexto o useState en un componente envolvente).
  - Header o área superior con mensaje de estado general (“Tienes X tareas hoy, Y esta semana, N materias en alerta/peligro”).

### Estados

AuthContext
- Estado: user, isLoading.
- Acciones: login(credentials), logout().
- Usa fetch contra /api/auth/login, /api/auth/logout, /api/auth/me.

ThemeContext
- Estado: theme: 'light' | 'dark'.
- Acción: toggleTheme().
- Persiste en localStorage y sincroniza data-theme en <body>.

### Integración con API

Cliente HTTP en `apps/web/src/lib/api.ts`.

Definir API_BASE:

const API_BASE =
  import.meta.env.PROD
    ? '/api'
    : 'http://localhost:8787/api';

Exponer métodos tipados:

- Auth: login, logout, me.
- Subjects: getSubjects, getSubject(id), getSubjectsAtRisk.
- Tasks: getTasks, getTasksToday, getTasksWeek, createTask, updateTask, deleteTask.
- Practice: getPracticeEntries, createPracticeEntry, updatePracticeEntry, deletePracticeEntry.
- Absences: getAbsences(subjectId), createAbsence, deleteAbsence.

Tipos importados desde packages/shared-types.

---

## 2.2. apps/api (Bun + Hono)

- Runtime: Bun.
- Framework: Hono (API HTTP minimalista, compatible con Bun).
- Lenguaje: TypeScript.

### Endpoints

Portar la lógica de Zo a las siguientes rutas (prefijo /api):

Auth
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/register (opcional, se puede mantener solo para desarrollo).

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

Almacenamiento: **SQLite** gestionado a través de `bun:sqlite`.

Módulo `lib/db.ts` en `apps/api`:
- Singleton de `Database` que detecta el entorno (`:memory:` para tests, `database.sqlite` para dev/prod).
- `initDB()`: Inicializa tablas con integridad referencial (`ON DELETE CASCADE`) y claves foráneas activas.
- `dbService`: Capa de abstracción CRUD con conversión automática de tipos (ej. strings ISO de SQLite a objetos `Date` de JS).

Esquema de Tablas:
- `users`: id, name, email, passwordHash, role.
- `subjects`: id, name, total_classes, user_id (FK).
- `absences`: id, subject_id (FK), date, type, calculated_value.
- `tasks`: id, subject_id (FK), title, description, status, due_date.
- `practice_journals`: id, subject_id (FK), date, content.
Config vía env:

- DATA_DIR con default ./data.

### Auth

Modelo de usuario simple:

- id, email, name, passwordHash (o password plain en dev), role?.

Sesiones:

- Opción A: cookie firmada (session ID) gestionada en JSON.
- Opción B: JWT con secret (más simple en hosting).

Usuario dev (solo desarrollo):

- email: demo@example.com
- password: demo123
- Si el usuario no existe, se crea automáticamente en users.json.
- Esta lógica debe estar claramente marcada como “dev only” y controlada por una env DEV_LOGIN_ENABLED=true.

### Lógica de negocio

Inasistencias

- Absence.type: 'standard' | 'justified'.
- calculated_value: 1.0 para standard, 0.5 para justified.

Porcentaje de inasistencias de una materia:

porcentaje = sum(calculated_value) / total_classes * 100

Estados:

- < 15% → Normal.
- >= 15% y < 20% → En alerta.
- >= 20% → En peligro.

- /api/subjects/at-risk calcula y devuelve solo materias en alerta o peligro.
- /api/tasks/today y /api/tasks/week filtran por fechas (hoy, semana actual) según due_date.

---

## 2.3. packages/shared-types

Paquete TypeScript con tipos compartidos:

- Subject
- Task
- PracticeJournal
- Absence
- User

Se publica dentro del monorepo (import local) y se utiliza tanto en apps/api como en apps/web para garantizar consistencia.

---

## 3. Hosting y despliegue

### 3.1. Opción principal: Render

Render ofrece una capa free razonable para servicios web y sitios estáticos, adecuada para proyectos personales como este dashboard.

Backend – apps/api

- Tipo: Web Service.
- Runtime: usar Bun (vía Dockerfile si es necesario):

FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "run", "src/server.ts"]

Variables de entorno:

- DATA_DIR=/data (montado como volumen o usando filesystem local de Render).
- DEV_LOGIN_ENABLED=false en producción.

Frontend – apps/web

- Tipo: Static Site.
- Build:
  - Build command: cd apps/web && bun install && bun run build
  - Public dir: apps/web/dist.

Ruteo /api

- Configurar en Render que /api/* se enrute al Web Service apps/api (mismo dominio o subdominio, según setup).

### 3.2. Opción alternativa: Cloudflare Pages + otro backend

Frontend

- Deploy de Astro a Cloudflare Pages, aprovechando su capa free muy amplia.

Backend

- Cloudflare Workers + Hono (adaptado a runtime Workers) o un Web Service en Render.

Configuración

- Rutas de Pages que apunten /api/* a Workers o al backend correspondiente.

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

- Si import.meta.env.DEV → API_BASE = 'http://localhost:8787/api'.
- Si prod → API_BASE = '/api'.

### 4.2. Deploy

Flujo básico:

1. Hacer push del repo a GitHub.
2. Conectar Render al repo:
   - Crear servicio para apps/api.
   - Crear Static Site para apps/web.
3. Configurar rutas /api → backend.
4. Verificar login y dashboard con datos demo.

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
- Portar endpoints /api/* desde Zo.
- Implementar auth + usuario demo.

Frontend Astro + React + Oat

- Scaffold proyecto Astro.
- Integrar Oat (CSS + JS) en layout base.
- Implementar ThemeContext y AuthContext.
- Portar páginas: Dashboard, Subjects, SubjectDetail, Tasks, Practice, Login.

Integración

- Configurar API_BASE y probar flujo end-to-end local.
- Sembrar datos demo en JSON.

Hosting

- Configurar servicios en Render (o combinación Cloudflare Pages + backend).
- Validar login y dashboard en entorno remoto.

Limpieza & docs

- Actualizar README con instrucciones de setup, dev y deploy.
- Mantener SPECS.md al día ante cualquier cambio estructural.
