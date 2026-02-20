# Roadmap de Implementación – Academic Planning Dashboard (Migración)

Este documento detalla el plan paso a paso para migrar el dashboard desde Zo.space hacia una arquitectura moderna basada en Bun, Hono, Astro y React.

---

## 1. Fase: Preparación (Estructura Monorepo)

**Objetivo:** Configurar el esqueleto del repositorio y las herramientas de desarrollo.

1.  **Inicialización del Repo:**
    - Crear el repositorio en GitHub.
    - Configurar `.gitignore` para Bun y Node.
    ```bash
    git init
    touch .gitignore # Añadir node_modules, dist, .env, data/*.json
    ```
2.  **Estructura de Carpetas:**
    - Crear los directorios definidos en `SPECS.md`.
    ```bash
    mkdir -p apps/web apps/api packages/shared-types infra
    ```
3.  **Configuración de Bun (Raíz):**
    - Inicializar el workspace (si se usa `package.json` raíz) o simplemente preparar los scripts de orquestación.
    - *Tarea:* Crear un `README.md` con las instrucciones básicas.
4.  **Shared Types:**
    - Definir las interfaces base en `packages/shared-types/index.ts` (Subject, Task, Absence, PracticeJournal, User).
    - Exponer estos tipos para que `apps/web` y `apps/api` puedan importarlos localmente.

---

## 2. Fase: Backend (Bun + Hono)

**Objetivo:** Construir una API funcional con persistencia en JSON.

1.  **Scaffold del Servidor:**
    - Configurar Hono en `apps/api`.
    ```bash
    cd apps/api
    bun init -y
    bun add hono
    ```
2.  **Capa de Persistencia (JSON DB):**
    - Implementar `lib/db.ts` usando `Bun.file` y `Bun.write`.
    - Crear la carpeta `data/` con archivos JSON iniciales (vacíos o con datos demo).
3.  **Endpoints de Auth:**
    - Implementar `/api/auth/login` (con lógica `DEV_LOGIN_ENABLED`).
    - Implementar `/api/auth/me` y `/api/auth/logout`.
4.  **Endpoints de Negocio:**
    - Implementar CRUD para Subjects, Tasks y Practice.
    - Implementar lógica de inasistencias (cálculo de % y estados de alerta/peligro).
    - Endpoint especial: `/api/subjects/at-risk`.
5.  **Validación:**
    - Probar los endpoints usando el cliente HTTP de preferencia o `curl`.

---

## 3. Fase: Frontend (Astro + React + Oat)

**Objetivo:** Crear una interfaz ultra-liviana y reactiva.

1.  **Scaffold de Astro:**
    - Crear el proyecto en `apps/web`.
    ```bash
    cd apps/web
    bun create astro@latest . -- --template minimal
    bun add @astrojs/react react react-dom
    ```
2.  **Integración de Oat UI:**
    - Añadir enlaces de Oat (CSS/JS) en el layout base (`Base.astro`).
    - Configurar `src/styles/theme.css` para personalización de variables.
3.  **Contextos y Estado:**
    - Implementar `AuthContext.tsx` (React) para manejar la sesión.
    - Implementar `ThemeContext.tsx` (React) para el modo oscuro (`data-theme`).
4.  **Cliente API:**
    - Crear `src/lib/api.ts` con fetch tipado apuntando a `API_BASE`.
5.  **Páginas Principales:**
    - `/login`: Formulario simple.
    - `/`: Dashboard con resumen (materias en riesgo, tareas próximas).
    - `/subjects`: Lista y detalle de materias.
    - `/tasks`: Kanban/Lista de tareas.

---

## 4. Fase: Integración y E2E Local

**Objetivo:** Asegurar que el flujo completo funciona en desarrollo.

1.  **Orquestación Local:**
    - Configurar script `dev` en la raíz para correr API y Web simultáneamente.
    ```json
    "dev": "bunx concurrently "cd apps/api && bun run dev" "cd apps/web && bun run dev""
    ```
2.  **Pruebas de Flujo:**
    - Login con usuario demo -> Ver dashboard -> Crear una tarea -> Ver actualización.
3.  **Shared Types Sync:**
    - Verificar que los cambios en tipos se reflejan en ambos lados sin errores de TS.

---

## 5. Fase: Hosting & Deploy

**Objetivo:** Publicar la aplicación en un entorno de producción (Render).

1.  **Backend (Render Web Service):**
    - Crear `apps/api/Dockerfile` (basado en `oven/bun`).
    - Configurar el servicio en Render apuntando a la subcarpeta `apps/api`.
    - Definir variables de entorno (PORT, DATA_DIR, etc.).
2.  **Frontend (Render Static Site):**
    - Configurar el build command: `cd apps/web && bun install && bun run build`.
    - Configurar el directorio público: `apps/web/dist`.
3.  **Ruteo de API:**
    - Configurar el "Rewrite" o "Redirect" en Render para que `/api/*` apunte al servicio de backend.
4.  **Smoke Test:**
    - Acceder a la URL de producción y validar el login.

---

## 6. Fase: Limpieza & Docs

1.  **README Final:** Instrucciones claras para nuevos desarrolladores.
2.  **Scripts de Mantenimiento:** Scripts para backup de los archivos JSON de `data/`.
3.  **Finalización de SPECS:** Asegurar que `SPECS.md` refleja el estado final de la implementación.

---

## Ideas futuras (Mejoras fuera del MVP)

- **Base de Datos Real:** Migrar de JSON a SQLite (usando `bun:sqlite`) o una DB externa (PostgreSQL en Render/Supabase) cuando la escala lo requiera.
- **Auth Robusta:** Implementar Lucia Auth o Clerk para manejo de sesiones más seguro.
- **Notificaciones:** Integración con Telegram/Email para alertas de "Materia en Peligro".
- **PWA:** Configurar Astro para que el dashboard funcione offline.
