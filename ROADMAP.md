# Roadmap de Implementación – Dashboard

Este documento detalla el plan paso a paso para migrar el dashboard desde Zo.space hacia una arquitectura moderna basada en Bun, Hono, Astro y React.

---

## 1. Fase: Preparación (Estructura Monorepo) [x]

**Objetivo:** Configurar el esqueleto del repositorio y las herramientas de desarrollo.

1.  **Inicialización del Repo:**
    - [x] Crear el auth_token en GitHub.
    - [x] Configurar `.gitignore` para Bun y Node.
    - [x] Configurar `git init` hecho y `.gitignore` configurado con `node_modules/`, `dist/` y `.env*`.

2.  **Estructura de Carpetas:**
    - [x] Crear los directorios definidos en `SPECS.md`.
    ```bash
    mkdir -p apps/web apps/api packages/shared-types infra
    ```
3.  **Configuración de Bun (Raíz):**
    - [x] Inicializar el workspace (si se usa `package.json` raíz) o simplemente preparar los scripts de orquestación.
    - [x] _Tarea:_ Crear un `README.md` con las instrucciones básicas.

4.  **Shared Types:** [x]
    - [x] Definir las interfaces base (Subject, Task, Absence, PracticeJournal, User).
    - [x] Reestructuración a `packages/shared-types/src/index.ts` para resolución robusta en el monorepo.
    - [x] Sincronización de dependencias de workspace en `apps/api` y `apps/web`.

---

## 2. Fase: Backend (Bun + Hono)

**Objetivo:** Construir una API funcional con persistencia en JSON.

1.  **Scaffold del Servidor:**
    - [x] Configurar Hono en `apps/api`.
    ```bash
    cd apps/api
    bun init -y
    bun add hono
    ```
2.  **Capa de Persistencia (SQLite DB):**
    - [x] Implementar `lib/db.ts` usando `bun:sqlite`.
    - [x] Configurar persistencia en disco (`database.sqlite`) y en memoria para tests.
    - [x] Implementar `dbService` con métodos CRUD robustos.
3.  **Configuración de imports de shared-types:**
    - **Estrategia Elegida:** Opción B (Alias de paquete `@dashboard/shared-types`).
    - **Archivos Configurados:**
      - `packages/shared-types/package.json` (definición del paquete).
      - `apps/api/tsconfig.json` (mapping de `paths` e inclusión de rutas en `include` para evitar error TS6307).
    - **Ejemplo de Import:** `import { User } from "@dashboard/shared-types";`
    - [x] Configuración completada.
4.  **Endpoints de Auth:**
    - [x] Implementar `/api/auth/login` con persistencia en SQLite.
    - [x] Implementar `/api/auth/me` y `/api/auth/logout`.
    - [x] Corregir error de JWT: especificar explícitamente el algoritmo `HS256` en middleware y funciones `sign`/`verify` de `lib/auth.ts`.
    - [x] Configurar y documentar `DEV_LOGIN_ENABLED` para login demo (`demo@example.com` / `demo123`) en desarrollo.
    - ⚠️ **ADVERTENCIA:** En producción, `DEV_LOGIN_ENABLED` DEBE ser `false`.
5.  **Endpoints de Negocio:**
    - [x] Implementar CRUD para Subjects, Tasks y Practice consumiendo `dbService`.
    - [x] Implementar lógica de inasistencias (cálculo de % y estados de alerta/peligro) mediante consultas SQL.
    - [x] Endpoint especial: `/api/subjects/at-risk`.
6.  **Validación y Testing:**
    - [x] Migrar infraestructura de testing a **Bun Test** (eliminando Vitest).
    - [x] Configurar `apps/api/tests/setup.ts` para usar SQLite en memoria (`:memory:`).
    - [x] Refactorizar todos los tests (`auth`, `subjects`, `tasks`, `journals`) para soportar JWT e integridad referencial.
    - **Testing backend:**
      - Correr tests: `cd apps/api && bun test`.
      - Correr tests en modo watch: `cd apps/api && bun test --watch`.
      - Cobertura: Completa para el core de la API.

7.  **Continuous Integration (CI):**
    - [x] Configurar workflow de GitHub Actions (`.github/workflows/ci.yml`).
    - [x] Ejecutar automáticamente los tests de `apps/api` en cada Push o PR hacia `main`.
    - **Estado del CI:** Los resultados se pueden ver en la pestaña **Actions** del repositorio en GitHub.

---

## 3. Fase: Frontend (Astro + React + Oat UI)

**Objetivo:** Crear una interfaz ultra-liviana y reactiva.

1.  **Scaffold de Astro:** [x]
    - [x] Crear el proyecto en `apps/web`.
    ```bash
    cd apps/web
    bun create astro@latest . -- --template minimal
    bun add @astrojs/react react react-dom
    ```
2.  **Integración de Oat UI:** [x]
    - [x] Migración exitosa de Oat UI (CSS/JS) de CDN externa a implementación local en `src/styles/theme.css`, eliminando errores de red y asegurando carga offline.
    - [x] Configurar `src/styles/theme.css` para personalización de variables.
    - [x] Alinear componentes principales (forms, badges, cards) al sistema de diseño de Oat mediante componentes reutilizables (`StatusBadge`, botones y tarjetas con clases `.oat-*`).
    - [x] **Refactorización de Layouts:** Separación de `Base.astro` (HTML base) y `DashboardLayout.astro` (Shell del dashboard) para permitir vistas limpias (Login/404).
    - [x] Limpieza de UI global: Header (Logo actualizado) y consistencia visual.
    - [x] Instalación de dependencias de UI críticas (`recharts`, `lucide-react`).
3.  **Contextos y Estado:** [x]
    - [x] Implementar `AuthContext.tsx` (React) para manejar la sesión.
    - [x] Implementar `ThemeContext.tsx` (React) para el modo oscuro (`data-theme`).
    - [x] Creación de `AppProviders.tsx` para envolver la jerarquía de React.
    - [x] Sincronización completa de tipos Date y cliente de API con soporte para revival automático.
    - [x] **Redirección y Seguridad:** Se actualizó `AuthContext.tsx` para obtener datos completos del usuario y realizar una redirección explícita a `/`. Se añadió blindaje con `window.location.replace` y estandarización de la clave `'auth_token'` para evitar bucles de navegación.
4.  **Cliente API:** [x]
    - [x] Crear `src/lib/api.ts` con fetch tipado apuntando a `API_BASE`.
    - [x] Implementado revival de fechas automático para consistencia con `shared-types`.
5.  **Páginas Principales:** [x]
    - [x] `/login`: Formulario de acceso con `AuthContext`.
    - [x] `/`: Dashboard con resumen (materias en riesgo, tareas próximas).
    - [x] `/subjects`: Lista de materias consumiendo la API.
    - [x] `/tasks`: Lista de tareas con capacidad de cambio de estado.
    - [x] `404`: Página de error personalizada con estética Oat y protección de privacidad.
6.  **Próximos pasos UI:** [ ]
    - **Vistas de Detalle Dinámicas:**
      - [x] Configurar rutas dinámicas `/subjects/[id]` y `/tasks/[id]`.
      - [x] Componente de visualización de métricas de asistencia (%).
      - [x] Historial de tareas y notas por materia.
    - **Formularios CRUD Completos:**
      - [x] Modales de creación para Subjects y Tasks.
      - [x] Flujo de edición y borrado con confirmación.
      - [x] Integración de notificaciones (Toasts) de éxito/error.
    - **Dashboard de Analíticas:**
      - [x] Integración de `Recharts` en el proyecto.
      - [x] Gráfico de "Semáforo de Asistencia" (riesgo de libre).
      - [x] Gráfico de cumplimiento de tareas (Burndown simple).
      - [x] Ruta dedicada `/analytics`.
    - **Registro de Journal Diario:**
      - [x] Editor Markdown minimalista para `PracticeJournal`.
      - [x] Selector de fecha y navegación por historial de reflexiones.
      - [x] Corregido error crítico de manejo de fechas (`Date` vs `Error`) que impedía la carga inicial del componente.

---

## 4. Fase: Integración y E2E Local

**Objetivo:** Asegurar que el flujo completo funciona en desarrollo.

1.  **Orquestación Local:** [x]
    - [x] Los scripts `dev:web`, `dev:api` y `dev` están configurados correctamente en la raíz para evitar recursión.
    - [x] El comando estándar para desarrollo local es:
      - `bun install` (una vez para instalar dependencias en todos los paquetes).
      - `bun run dev` (desde la raíz para levantar API + Web en paralelo usando `concurrently`).
    ```json
    "dev:web": "cd apps/web && bun run dev",
    "dev:api": "cd apps/api && bun run dev",
    "dev": "bunx concurrently \"bun run dev:web\" \"bun run dev:api\""
    ```
2.  **Pruebas de Flujo:**
    - [x] **Login con usuario demo:** Verificado el flujo completo desde `/login` hasta el dashboard (`/`) tras autenticación exitosa con redirección automática.
    - [x] **Guardia de Redirección:** Verificado que usuarios ya logueados son expulsados de `/login` hacia `/`.
    - [ ] Crear una tarea -> Ver actualización.
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
