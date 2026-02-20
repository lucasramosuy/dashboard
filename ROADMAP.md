# Roadmap de Implementación – Academic Planning Dashboard (Migración)

Este documento detalla el plan paso a paso para migrar el dashboard desde Zo.space hacia una arquitectura moderna basada en Bun, Hono, Astro y React.

---

## 1. Fase: Preparación (Estructura Monorepo) [x]

**Objetivo:** Configurar el esqueleto del repositorio y las herramientas de desarrollo.

1.  **Inicialización del Repo:**
    - [x] Crear el repositorio en GitHub.
    - [x] Configurar `.gitignore` para Bun y Node.
    - [x] Configurar `git init` hecho y `.gitignore` configurado con `node_modules/`, `dist/` y `.env*`.
    
2.  **Estructura de Carpetas:**
    - [x] Crear los directorios definidos en `SPECS.md`.
    ```bash
    mkdir -p apps/web apps/api packages/shared-types infra
    ```
3.  **Configuración de Bun (Raíz):**
    - [x] Inicializar el workspace (si se usa `package.json` raíz) o simplemente preparar los scripts de orquestación.
    - [x] *Tarea:* Crear un `README.md` con las instrucciones básicas.
    
4.  **Shared Types:**
    - [x] Definir las interfaces base en `packages/shared-types/index.ts` (Subject, Task, Absence, PracticeJournal, User).
    - [x] Exponer estos tipos para que `apps/web` y `apps/api` puedan importarlos localmente.

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
2.  **Capa de Persistencia (JSON DB):**
    - [x] Implementar `lib/db.ts` usando `Bun.file` and `Bun.write`.
    - [x] Crear la carpeta `data/` con archivos JSON iniciales (vacíos o con datos demo).
3.  **Configuración de imports de shared-types:**
    - **Estrategia Elegida:** Opción B (Alias de paquete `@dashboard/shared-types`).
    - **Archivos Configurados:** 
      - `packages/shared-types/package.json` (definición del paquete).
      - `apps/api/tsconfig.json` (mapping de `paths` e inclusión de rutas en `include` para evitar error TS6307).
    - **Ejemplo de Import:** `import { User } from "@dashboard/shared-types";`
    - [x] Configuración completada.
4.  **Endpoints de Auth:**
    - [x] Implementar `/api/auth/login` (con lógica `DEV_LOGIN_ENABLED`).
    - [x] Implementar `/api/auth/me` y `/api/auth/logout`.
    - [x] Corregir error de JWT: especificar explícitamente el algoritmo `HS256` en middleware y funciones `sign`/`verify` de `lib/auth.ts`.
    - [x] Configurar y documentar `DEV_LOGIN_ENABLED` para login demo (`demo@example.com` / `demo123`) en desarrollo.
    - ⚠️ **ADVERTENCIA:** En producción, `DEV_LOGIN_ENABLED` DEBE ser `false`.
5.  **Endpoints de Negocio:**
    - [x] Implementar CRUD para Subjects, Tasks y Practice.
    - [x] Implementar lógica de inasistencias (cálculo de % y estados de alerta/peligro).
    - [x] Endpoint especial: `/api/subjects/at-risk`.
6.  **Validación y Testing:**
    - [x] Configurar **Vitest** en `apps/api`.
    - [x] Ajustar `apps/api/tsconfig.json` para incluir carpeta `tests/` y tipos de `vitest/globals`.
    - [x] Implementar tests de integración para Health y Auth (`apps/api/tests/auth.test.ts`).
    - [x] Resolver errores de tipado en tests mediante casting de respuestas JSON (`as any`) para facilitar el acceso a propiedades en aserciones.
    - [x] **Infraestructura de Testing Robustecida:**
      - Configurar `apps/api/tests/setup.ts` para setear variables de entorno (`JWT_SECRET`, `DEV_LOGIN_ENABLED`) automáticamente.
      - Implementar **stubs en memoria** para `lib/db.ts` en los tests, eliminando la dependencia de las APIs de Bun (`Bun.file`) y del sistema de archivos real.
    - **Testing backend:**
      - Correr tests: `cd apps/api && bun run test`.
      - Correr tests en modo watch: `cd apps/api && bun run test:watch`.
      - Cobertura actual: Health check, Auth, Subjects (CRUD + at-risk), Tasks y Practice Journals. Validado al 100% con stubs.
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
    - [x] Añadir enlaces de Oat (CSS/JS) en el layout base (`Base.astro`).
    - [x] Configurar `src/styles/theme.css` para personalización de variables.
    - [x] Alinear componentes principales (forms, badges, cards) al sistema de diseño de Oat mediante componentes reutilizables (`StatusBadge`, botones y tarjetas con clases `.oat-*`).
3.  **Contextos y Estado:** [x]
    - [x] Implementar `AuthContext.tsx` (React) para manejar la sesión.
    - [x] Implementar `ThemeContext.tsx` (React) para el modo oscuro (`data-theme`).
    - [x] Creación de `AppProviders.tsx` para envolver la jerarquía de React.
4.  **Cliente API:** [x]
    - [x] Crear `src/lib/api.ts` con fetch tipado apuntando a `API_BASE`.
5.  **Páginas Principales:** [x]
    - [x] `/login`: Formulario de acceso con `AuthContext`.
    - [x] `/`: Dashboard con resumen (materias en riesgo, tareas próximas).
    - [x] `/subjects`: Lista de materias consumiendo la API.
    - [x] `/tasks`: Lista de tareas con capacidad de cambio de estado.
6.  **Próximos pasos UI:** [ ]
    - [x] **Vistas de Detalle Dinámicas:**
        - [x] Configurar rutas dinámicas `/subjects/[id]` y `/tasks/[id]`.
        - [x] Componente de visualización de métricas de asistencia (%).
        - [x] Historial de tareas y notas por materia.
    - [x] **Formularios CRUD Completos:**
        - [x] Modales de creación para Subjects y Tasks.
        - [x] Flujo de edición y borrado con confirmación.
        - [x] Integración de notificaciones (Toasts) de éxito/error.
    - [x] **Dashboard de Analíticas:**
        - [x] Integración de `Recharts` en el proyecto.
        - [x] Gráfico de "Semáforo de Asistencia" (riesgo de libre).
        - [x] Gráfico de cumplimiento de tareas (Burndown simple).
        - [x] Ruta dedicada `/analytics`.
    - [x] **Registro de Journal Diario:**
        - [x] Editor Markdown minimalista para `PracticeJournal`.
        - [x] Selector de fecha y navegación por historial de reflexiones.

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
