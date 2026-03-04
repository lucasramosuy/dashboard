# ROADMAP

## ✅ Fase 1 — Backend & DB básica

- Monorepo con `apps/api`, `apps/web`, `packages/shared-types`.
- API Hono + Bun + Turso (o SQLite local en dev).
- Tablas: `users`, `subjects`, `tasks`, `absences`, `practice_journals`.
- JWT propio inicial (`auth.ts`), luego migrado a **Better Auth** en Fase 6.
- `dbService` con servicios para users/subjects/tasks/absences/journals.
- Tests de API para auth, subjects, tasks, practice_journals.
- `seed.ts` para usuario demo + datos de ejemplo.
- Dockerfiles para API y Web, CORS dinámico, `render.yaml`.

## ✅ Fase 2 — Frontend base

- Astro + React + Oat UI.
- `AuthContext` con `user`, `loading`, login/logout vía Better Auth client.
- Theme con nanostores + script inline para evitar flash.
- Páginas Astro: `/`, `/login`, `/subjects`, `/tasks`, `/analytics`, `/journal`, `404`.
- Páginas React: `DashboardPage`, `SubjectsPage`, `TasksPage`, `AnalyticsPage`, `JournalPage`, `LoginPage`.
- Layouts: `Base.astro`, `DashboardLayout.astro`.
- Cliente API: `API_BASE = "/api"` (sin host hardcodeado).

## ✅ Fase 3 — UI por pantalla

- `/subjects`: lista, form, detalle, inasistencias, métricas.
- `/tasks`: lista, form, detalle, estados, orden por fecha.
- `/journal`: selección de fecha, UC, guardado, historial.
- `/analytics`: pie chart de tareas, barras de asistencia.
- Toasts en operaciones CRUD y errores.
- Spinners consistentes.

## ✅ Fase 4 — UX y theme

- `ThemeToggle` en sidebar, mobile y `/login`.
- `LogoutButton` funcional (limpia token + redirige).
- Inter auto-hosteada y aplicada.
- `robots.txt` (Disallow: /).
- `<meta name="description">` y `<link rel="canonical">` en `Base.astro`.

---

## SEGUIMOS DESDE ACÁ

## ✅ Fase 5 — Sistema de invites (registro controlado, PRIORIDAD 1)

**Objetivo:** solo personas con un invite code de un solo uso pueden registrarse, con un máximo de 10 invites activos.

### 5.1. Modelo y DB

- [x] Agregar tabla `invites` en `initDB()`:
  - Campos: `id`, `code` (UNIQUE), `used` (boolean), `created_at`.
- [x] Extender `dbService` con:
  - `invites.create(code)`.
  - `invites.getByCode(code)`.
  - `invites.markUsed(id)`.
  - `invites.countActive()`.

### 5.2. Script CLI para crear invites

- [x] Crear `apps/api/src/invites.ts`:
  - Inicializa DB.
  - Lee cuántos invites activos hay (`used = 0`).
  - Si ya hay 10, no crea más.
  - Genera N códigos (ej. 3) con `randomUUID()` (o formato corto).
  - Inserta con `dbService.invites.create(code)`.
  - Imprime los códigos en consola.
- [x] Añadir script en `apps/api/package.json`:
  - `"invites": "bun src/invites.ts"`.

### 5.3. Endpoint de registro con invite

- [x] Agregar `POST /api/auth/register` en `auth.ts`:
  - Body: `name`, `email`, `password`, `inviteCode`.
  - Buscar invite por código:
    - Si no existe o `used = 1` → 403.
  - Comprobar límite global de usuarios.
  - Verificar que el email no exista.
  - Crear usuario con `hashPassword`.
  - Marcar invite `used = 1`.
  - Devolver `token` + `user` (login automático).

### 5.4. Frontend para registro

- [x] Añadir método `register` en `apps/web/src/lib/api.ts`:
  - `POST /api/auth/register` con `{ name, email, password, inviteCode }`.
- [x] Crear UI mínima:
  - Pestaña o modal “Crear cuenta” en `LoginPage`.
  - Campos: Nombre, Email, Password, Invite code.
  - Manejo de errores de la API (`error` en JSON).
- [x] Flujo:
  - Si el registro es OK, guardar `token` en `AuthContext` y redirigir al dashboard.

### 5.5. Política de demo + prod

- [x] Mantener usuario(s) demo actuales:
  - `DEV_LOGIN_ENABLED=true` solo en dev.
  - En prod, `DEV_LOGIN_ENABLED=false` (nadie entra como demo desde afuera).
- [x] Definir:
  - Cuántos usuarios reales máximos permitís (además de demo).
  - Cuántos invites querés tener activos a la vez (máx. 10 ya está decidido).

### 5.6. Tests para invites y registro

- [x] Tests de invites en API (`apps/api/tests/invites.test.ts`):
  - Crear invites vía `dbService.invites.create`.
  - Probar que `countActive` respeta el límite.
  - Probar que `POST /api/auth/register`:
    - Falla sin invite o con invite usado.
    - Crea usuario, marca invite como usado y devuelve token.
- [x] Tests de registro en frontend (opcional, mínimo):
  - Verificar que el formulario llama a `api.register` con los campos correctos.
  - Manejo de errores (`error` de la API) en UI.

---

### ✅ Fase 5.7 — Push a GitHub + Setup de entorno Windows

**Objetivo:** dejar el código en un estado limpio y versionado en GitHub, y verificar que el entorno de desarrollo funciona correctamente en Windows antes de continuar con las fases siguientes.

---

#### Por qué insertar esta fase aquí

La Fase 5 cierra el ciclo de funcionalidad core (auth + invites), lo que significa que el proyecto ya tiene una base estable, testeada y sin deuda técnica urgente. Es el mejor punto de corte antes de arrancar con integraciones externas (iCal, Schoology) que van a requerir más iteración y posiblemente más herramientas. Migrar el entorno _durante_ una fase de integración compleja es un riesgo innecesario.

Factores técnicos concretos considerados:

- **Bun en Windows:** tiene soporte nativo desde v1.0, pero hay edge cases con rutas, symlinks y scripts de shell que hay que verificar antes de seguir.
- **Turso/SQLite local:** el archivo `.db` y los paths relativos pueden comportarse distinto entre Linux y Windows si no se usan paths absolutos o variables de entorno correctamente.
- **Variables de entorno:** los `.env` con comillas o saltos de línea a veces se parsean diferente en Windows según el shell (CMD vs PowerShell vs Git Bash).
- **Docker:** si se usa Docker Desktop en Windows, hay que confirmar que los Dockerfiles del monorepo funcionan igual.
- **Git line endings:** el `CRLF` vs `LF` puede romper scripts bash o archivos de config si no está configurado `.gitattributes`.

---

#### 5.7.1. Limpieza y preparación del repo

- [x] Verificar que `.gitignore` excluye correctamente:
  - `node_modules/`, `.turbo/`, `dist/`, `*.db`, `*.db-shm`, `*.db-wal`
  - Archivos `.env` y `.env.local` (nunca deben subir)
- [x] Agregar `.gitattributes` en la raíz para normalizar line endings:
  ```
  * text=auto eol=lf
  *.bat text eol=crlf
  ```
- [x] Verificar que no hay secrets hardcodeados en el código (JWT secret, URLs de DB, etc.).
- [x] Asegurarse de que el `README.md` tiene instrucciones mínimas de setup (`bun install`, `bun run dev`).

---

#### 5.7.2. Push a GitHub

- [x] Crear el repositorio en GitHub (privado).
- [x] Hacer el push inicial desde el VPS:
  ```bash
  git init
  git add .
  git commit -m "chore: initial commit — phases 1–5 complete"
  git remote add origin git@github.com:lucasramosuy/dashboard.git
  git push -u origin main
  ```
- [x] Verificar en GitHub que la estructura del monorepo se ve correcta (`apps/`, `packages/`).

---

#### 5.7.3. Setup del entorno en Windows

- [x] Instalar herramientas base:
  - **Git for Windows** (incluye Git Bash)
  - **Bun** (`powershell -c "irm bun.sh/install.ps1 | iex"`)
  - **Node.js LTS** (solo como fallback si alguna tool lo requiere)
  - **VS Code** con extensiones: Astro, ESLint, Prettier, Tailwind CSS IntelliSense
- [x] Clonar el repo desde GitHub en Windows:
  ```bash
  git clone git@github.com:lucasramosuy/dashboard.git
  cd <./dashboard>
  bun install
  ```
- [x] Copiar los `.env` manualmente desde el VPS (nunca via git):
  - `apps/api/.env`
- [x] Verificar que el entorno de desarrollo levanta correctamente:

  ```bash
  bun run dev
  ```

  - API responde en `localhost:8787`
  - Web responde en `localhost:4321`

- [x] Correr los tests desde Windows para confirmar que pasan:
  ```bash
  cd apps/api && bun test
  ```

---

#### 5.7.4. Configurar flujo de trabajo Git

- [x] Definir rama principal: `dev`.
- [x] Verificar que se puede hacer push desde Windows sin problemas de SSH keys (agregar la clave pública de Windows a GitHub si es diferente a la del VPS).

---

#### 5.7.5. Smoke test final

- [x] Desde Windows, hacer un cambio menor (ej.: un comentario en `README.md`), comitearlo y pushearlo.
- [x] Confirmar que el VPS puede hacer `git pull` y recibir ese cambio.
- [x] A partir de este punto: **el VPS pasa a ser solo entorno de deploy/producción**; el desarrollo cotidiano se hace desde Windows.

---

## ✅ Fase 6 — Migración a Better Auth

**Objetivo:** reemplazar el sistema de autenticación custom (JWT propio) por **Better Auth**, aprovechando que provee gestión de sesiones, manejo automático de cookies y un cliente frontend out-of-the-box para Astro/React.

### 6.1. Ajuste de Base de Datos y Tipos

- [x] Instalar dependencias `@better-auth/cli`, `better-auth`.
- [x] Ejecutar `npx @better-auth/cli generate` o ajustar el esquema manualente para agregar las tablas que requiere Better Auth (`session`, `account`, `verification`).
- [x] Modificar la tabla principal de `users` (y el tipo en `packages/shared-types`) para adaptarla a la estructura que requiere Better Auth (id, name, email, emailVerified, image, createdAt, updatedAt).
- [x] Migrar el usuario demo (o resetear la DB local si es dev) para que cumpla con el nuevo esquema.

### 6.2. Configuración en apps/api (Backend)

- [x] Crear el archivo de configuración `auth.ts` (o `lib/auth.better.ts`) usando el adaptador de base de datos adecuado (seguramente SQLite, o compatibilidad con Turso/Drizzle/Kysely o SQL plano si aplica).
- [x] Mapear los endpoints en Hono: acoplar el handler de Better Auth (e.g. `auth.handler`) a un wildcard router tipo `app.all("/api/auth/*", ...)` para que maneje login, registro, logout y sesiones.
- [x] Eliminar la lógica vieja de JWT y hashing (`lib/auth.ts`, `routes/auth.ts` antiguo).
- [x] Refactorizar el middleware de permisos/sesión en Hono (ej. reemplazar `jwt(...)` por extraer el token de la sesión con Better Auth y validar que el usuario existe).

### 6.3. Configuración en apps/web (Frontend)

- [x] Crear el cliente de Better Auth (ej. `lib/auth-client.ts`) usando `createAuthClient`.
- [x] Actualizar el AuthContext para que deje de guardar el JWT en memoria/localStorage y empiece a consumir la sesión de estado de Better Auth (la cual funciona primordialmente con HTTP-only cookies gestionadas por el cliente).
- [x] Refactorizar llamadas de `login` y `register` en `apps/web/src/lib/api.ts` para que utilicen los métodos del nuevo `authClient.signIn.email` y `authClient.signUp.email`.
- [x] Refactorizar el proceso de Logout usando `authClient.signOut`.

### 6.4. Adaptación de Invites (Plugins o Lógica extendida)

- [x] Dado que tenemos el requerimiento estricto _"solo personas con un invite code"_:
  - Opcion A: Evaluar si se puede interceptar el registro usando `plugins` de Better Auth o callbacks (ej. `databaseHooks.user.create`).
  - Opcion B: Mantener un endpoint proxy en Hono `/api/custom-register` que primero valide en DB el inviteCode y luego llame internamente a Better Auth para la creación real de credenciales.
- [x] Ajustar tests relacionados al registro con código de invitación.

### 6.5. Verificación (Smoke Test)

- [x] Confirmar que se han eliminado los archivos viejos de auth.
- [x] Confirmar que se ha configurado Better Auth con Turso.
- [x] Confirmar login con usuario dev exitoso.
- [x] Confirmar registro con invite code descartándolo (used = 1) tras finalizar.
- [x] Borrado de credenciales/tokens viejos en LocalStorage.
- [x] Verificar persistencia de sesión cerrando y abriendo pestanas.
- [x] Verificar que todos los tests esten bien escritos y pasen correctamente.

---

### ✅ Fase 6.6 — Auditoría de Deuda Técnica y Buenas Prácticas

**Objetivo:** Antes de sumar nuevas integraciones complejas (como iCal), asegurar que la base de código actual es robusta, escalable y emplea patrones modernos y limpios tanto en el frontend como en el backend.

#### 6.6.1. Backend Integridad y Escalabilidad (Hono + Bun)

- [x] **Validación Zod Extrema:** Implementar `zod` y `@hono/zod-validator` en **absolutamente todos** los endpoints POST/PUT/PATCH para validar invariantes del negocio antes de tocar la DB.
- [x] **Capa de Servicios (Service Layer):** Extraer la lógica de negocio compleja (ej. cálculos de asistencia, sincronización de sesiones) fuera de los controladores de rutas (Handlers) hacia funciones en `src/services/`.
- [x] **Manejo Centralizado de Errores:** Implementar `app.onError` global en Hono para devolver respuestas JSON estructuradas consistentes (ej. `{ statusCode, code, message }`) en lugar de depender de try/catches individuales que exponen detalles internos.
- [x] **Type-safety en Base de Datos:** Evaluar e implementar un generador de queries con tipado seguro como Kysely o Drizzle, o un tipado estricto exhaustivo sobre las tuplas de `@libsql/client` para prevenir errores de columnas en tiempo de ejecución.

#### 6.6.2. Frontend Arquitectura y Reactividad (React + Astro)

- [x] **Data Fetching Sólido:** Migrar llamadas sueltas de `fetch` en `useEffect` a librerías de grado productivo como **TanStack Query (React Query)** para manejar automáticamente cacheo, deduplicación de requests, states predecibles (`isLoading`, `isError`) y re-fetching.
- [x] **Separación Container-Presenter:** Aislar la lógica de negocio en Custom Hooks (ej. `useTasks()`, `useSubjects()`) separándola de los componentes de UI puramente visuales ("dumb components").
- [x] **Reutilización del Sistema Abstracto de Diseño:** Auditar el uso de clases y utilidades de Oat para garantizar consistencia. Evitar estilos en línea (`style={{...}}`) siempre que sea posible.
- [x] **A11y (Accesibilidad):** Auditar el uso correcto de ARIA Attributes, enfoques con teclado (`tabIndex`) y soporte nativo de lectores de pantalla en componentes dinámicos (modales, popovers).

#### 6.6.3. Código Limpio Común (Shared)

- [x] **Shared Schemas:** Mover los esquemas de Zod al paquete `packages/shared-types` para reutilizar las mismas reglas de validación en el cliente (formularios) y en el servidor (endpoints).
- [x] **Limpieza de Código Muerto:** Ejecutar herramientas tipo `knip` o buscar manualmente funciones, exportaciones y archivos huérfanos de la vieja implementación JWT/Local que hayan quedado perdidos.
- [x] Archivos en la raíz.

---

## ✅ Fase 7 — Integración iCal por usuario (Schoology)

**Objetivo:** cada usuario puede vincular su feed iCal/webcal de Schoology y sincronizar eventos hacia el dashboard.

### 7.1. Modelo y DB (Ajustado para Better Auth)

- [x] Extender tabla `users` mediante esquema de Better Auth:
  - Modificar configuración en `lib/auth.better.ts` para inyectar un nuevo plugin o usar `additionalFields` (`ical_url`, `last_ical_sync`).
  - Ejecutar migraciones o alterar de forma segura en Kysely/Turso para crear las nuevas columnas en la tabla `user`.
- [x] Opcionalmente, permitir que estos campos se lean desde el Session object devuelto al frontend, ajustando las respuestas de Better Auth.

### 7.2. Endpoints de configuración y sync (Zod + Services)

- [x] Endpoint para configurar iCal (`PATCH /api/auth/me/ical` u homólogo):
  - Validar payload usando `zod` (`@hono/zod-validator`) con esquemas en `shared-types`.
  - Normalizar `webcal://` a `https://`.
  - Actualizar el usuario logueado en DB según la sesión extraída desde `auth.api.getSession(c.req.raw)`.
- [x] Servicio de sincronización:
  - Crear `src/services/icalService.ts` manejando el parseo de `.ics` de manera desacoplada del controlador Hono.
  - Endpoint `POST /api/ical/sync`: invoca `icalService.syncUserCalendar(userId, userIcalUrl)`.
  - Convertir eventos a array de records validados y delegar a una función de inserción masiva (`dbService.tasks.createMassive`).

### 7.3. UI (React Query)

- [x] Dashboard: sección secundaria o de settings "Integraciones y Calendario".
  - Campo para URL de Schoology (webcal/https).
- [x] Integrar mutaciones usando TanStack Query (`useMutation`):
  - Botón "Guardar" y "Sincronizar ahora" con manejo de stado predecible (`isLoading`, `isError`).
  - Mostrar feedback visual o Toasts del error lanzado por la API JSON.

### 7.4. Tests para iCal

- [x] Pruebas unitarias de parser en `apps/api/tests/ical.test.ts`.
- [x] Comprobación del parseo `webcal://` -> `https://`.
- [x] Ignorar creación repetitiva de la misma clase.

---

## ✅ Fase 8 — UX Mobile: nuevo panel flotante (menú `☰`)

**Objetivo:** reemplazar el bottom navbar actual en mobile por un botón flotante tipo menú que despliega un panel grande con las opciones de navegación y acciones.

### 8.1. Diseño del nuevo menú mobile

- [x] Eliminar/ocultar el bottom‑nav actual en mobile (`DashboardLayout.astro`).
- [x] Añadir un botón flotante icono `☰` en la esquina inferior derecha (`< 768px`).
- [x] Crear el componente panel usando el principio de **Container-Presenter**. Separar lógica de apertura, hooks `useMobileMenu()` y lock de scroll en un componente `MenuContainer` que envuelva al puramente de vista.

### 8.2. Contenido e Interacción

- [x] Botones para links rápidos de navegación y acciones clave: Dashboard, UC, Tareas, ThemeToggle y Logout.
- [x] Manejo semántico ARIA para que lectores de pantalla detecten que es un Dialog Modal (`role="dialog"`, atrapar Focus, Cerrar con `Esc`).

---

## ✅ Fase 9 — Enriquecimiento académico y Tasks avanzadas

### 9.1. Renombrar “UCs” → “UC (Unidad Curricular)”

- [x] En UI, traducir y referenciar listas cerradas siempre como "UC".

### 9.2 y 9.4. Single Source Of Truth (Paso 0 antes de la UI)

- [x] Actualizar paquetes de tipos y esquemas:
  - En `packages/shared-types`, extender `SubjectSchema` y `TaskSchema` con los nuevos campos propuestos (Trayecto, Duración, Tipo, Calificación, Archivo, Comentarios).
  - Propagar esquema hacia la DB (Turso/Kysely).

### 9.3. Reglas de duración (Reglamento CFE en Service Layer)

- [x] En `/subjects` se debe sugerir cantidad de `total_classes`.
- [x] Añadir métodos de cálculo aislado en `src/services/subjectsService.ts`:
  - Las UC semestrales = 15 semanas (15 sugerido).
  - Las UC anuales = 30 semanas (30 sugerido).
- [x] Formulario frontend aprovecha el esquema compartido y una consulta inicial para pre-poblar.

### 9.5 y 9.6. Integración iCal y Notas

- [x] Frontend: Nuevas columnas dinámicas en tabla de Tasks.
- [x] Endpoint `/api/subjects/:id` puede pre-computar promedios de `grade` vía SQL queries optimizadas con Kysely para retornar el dígito limpio al UI.
- [x] `TaskForm` validará campos con scheme Zod compartido, enviando mutaciones a React Query de forma robusta.

---

## 🟡 Fase 10 — Planner semanal tipo WeekToDo

**Objetivo:** tener una vista semanal estilo WeekToDo que complemente `/tasks`.

### 10.1. Nueva ruta y Hooks de React Query

- [x] Nueva view `/planner` re-utilizando componentes visuales existentes.
- [x] Permitir que el usuario cree subtareas directamente desde el planner que viven allí y se quedan marcadas como "hechas" en el visual en el que estan.
- [x] Creación de hooks custom como `useWeeklyTasks()` basados en TanStack Query, apuntando a la api actual, pero filtrados/agrupados por día. Se recomienda agrupar del lado del backend (Service Layer) y retornar un JSON estructurado.

### 10.2. Funcionalidad V1 y V2

- [x] V1: Estructura Read-only visual (lunes-domingo). Datos nutridos y cacheados por React Query.
- [x] V2: Mutaciones "Drag and Drop" atadas internamente a **Mutaciones Optimistas (Optimistic Updates)** de `react-query`. Así evitan spinners o bloqueos visuales al mover tarjetas de una columna a otra.

---

## 🟡 Fase 11 — Higiene, tests, calidad y deploy

- [ ] Verificar que dev usa la DB de dev y prod usa la DB de prod en Turso y eliminar slite en local.
- [ ] Revisar y refactorizar todos los estilos del theme.css para que tengan consistencia en toda la app.
- [ ] Verificar que BUENAS_PRACTICAS.md se cumple archivo por archivo en /apps/api.
- [ ] Verificar que BUENAS_PRACTICAS.md se cumple archivo por archivo en /apps/web.
- [ ] Limpiar DB de Turso para prod.
- [ ] Crear invites para usuarios de prod.
- [ ] Sync final de esquemas en producción. Ejecutar `npx @better-auth/cli migrate` y asegurarse de que Turso refleje todas las columnas extra (como las del feed iCal y notas).
- [ ] Verificar consistencia de código estricto en la raíz:
  - `bun run format`, `bun run lint` y **sobre todo `bun run check`**, afirmando que Typescript valide en frontend, backend y `shared-types`.
- [ ] Replicacion Final Prod vs Local:
  - Verificar que Render inyecta adecuadamente `TURSO_DATABASE_URL` y variables base (`BETTER_AUTH_URL`).
  - Auditar que endpoints expuestos filtran su contenido estrictamente por `userId`.
- [ ] Smoke Test End 2 End:
  - Login con un usuario vivo, chequeo exhaustivo en la consola web e inspección con Dev Tools Lighthouse Report para pulir advertencias de performance y A11y.
