## ✅ Fase 1 — Backend & DB básica

- Monorepo con `apps/api`, `apps/web`, `packages/shared-types`.
- API Hono + Bun + Turso (o SQLite local en dev).
- Tablas: `users`, `subjects`, `tasks`, `absences`, `practice_journals`.
- JWT propio (`auth.ts`): `createToken`, `verifyToken`, `hashPassword`, `verifyPassword`.
- `dbService` con servicios para users/subjects/tasks/absences/journals.
- Tests de API para auth, subjects, tasks, practice_journals.
- `seed.ts` para usuario demo + datos de ejemplo.
- Dockerfiles para API y Web, CORS dinámico, `render.yaml`.

## ✅ Fase 2 — Frontend base

- Astro + React + Oat UI.
- `AuthContext` con `user`, `token`, `loading`, login/logout.
- Theme con nanostores + script inline para evitar flash.
- Páginas Astro: `/`, `/login`, `/subjects`, `/tasks`, `/analytics`, `/journal`, `404`.
- Páginas React: `DashboardPage`, `SubjectsPage`, `TasksPage`, `AnalyticsPage`, `JournalPage`, `LoginPage`.
- Layouts: `Base.astro`, `DashboardLayout.astro`.
- Cliente API: `API_BASE = "/api"` (sin host hardcodeado).

## ✅ Fase 3 — UI por pantalla

- `/subjects`: lista, form, detalle, inasistencias, métricas.
- `/tasks`: lista, form, detalle, estados, orden por fecha.
- `/journal`: selección de fecha, materia, guardado, historial.
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
# 🔁 Fase 5.7 — Push a GitHub + Setup de entorno Windows

**Objetivo:** dejar el código en un estado limpio y versionado en GitHub, y verificar que el entorno de desarrollo funciona correctamente en Windows antes de continuar con las fases siguientes.

---

## Por qué insertar esta fase aquí

La Fase 5 cierra el ciclo de funcionalidad core (auth + invites), lo que significa que el proyecto ya tiene una base estable, testeada y sin deuda técnica urgente. Es el mejor punto de corte antes de arrancar con integraciones externas (iCal, Schoology) que van a requerir más iteración y posiblemente más herramientas. Migrar el entorno *durante* una fase de integración compleja es un riesgo innecesario.

Factores técnicos concretos considerados:

- **Bun en Windows:** tiene soporte nativo desde v1.0, pero hay edge cases con rutas, symlinks y scripts de shell que hay que verificar antes de seguir.
- **Turso/SQLite local:** el archivo `.db` y los paths relativos pueden comportarse distinto entre Linux y Windows si no se usan paths absolutos o variables de entorno correctamente.
- **Variables de entorno:** los `.env` con comillas o saltos de línea a veces se parsean diferente en Windows según el shell (CMD vs PowerShell vs Git Bash).
- **Docker:** si se usa Docker Desktop en Windows, hay que confirmar que los Dockerfiles del monorepo funcionan igual.
- **Git line endings:** el `CRLF` vs `LF` puede romper scripts bash o archivos de config si no está configurado `.gitattributes`.

---

## 5.7.1. Limpieza y preparación del repo

- [ ] Verificar que `.gitignore` excluye correctamente:
  - `node_modules/`, `.turbo/`, `dist/`, `*.db`, `*.db-shm`, `*.db-wal`
  - Archivos `.env` y `.env.local` (nunca deben subir)
- [ ] Agregar `.gitattributes` en la raíz para normalizar line endings:
  ```
  * text=auto eol=lf
  *.bat text eol=crlf
  ```
- [ ] Verificar que no hay secrets hardcodeados en el código (JWT secret, URLs de DB, etc.).
- [ ] Asegurarse de que el `README.md` tiene instrucciones mínimas de setup (`bun install`, `bun run dev`).

---

## 5.7.2. Push a GitHub

- [ ] Crear el repositorio en GitHub (privado).
- [ ] Hacer el push inicial desde el VPS:
  ```bash
  git init
  git add .
  git commit -m "chore: initial commit — phases 1–5 complete"
  git remote add origin git@github.com:<usuario>/<repo>.git
  git push -u origin main
  ```
- [ ] Verificar en GitHub que la estructura del monorepo se ve correcta (`apps/`, `packages/`).

---

## 5.7.3. Setup del entorno en Windows

- [ ] Instalar herramientas base:
  - **Git for Windows** (incluye Git Bash)
  - **Bun** (`powershell -c "irm bun.sh/install.ps1 | iex"`)
  - **Node.js LTS** (solo como fallback si alguna tool lo requiere)
  - **VS Code** con extensiones: Astro, ESLint, Prettier, Tailwind CSS IntelliSense
- [ ] Clonar el repo desde GitHub en Windows:
  ```bash
  git clone git@github.com:<usuario>/<repo>.git
  cd <repo>
  bun install
  ```
- [ ] Copiar los `.env` manualmente desde el VPS (nunca via git):
  - `apps/api/.env`
  - `apps/web/.env` (si existe)
- [ ] Verificar que el entorno de desarrollo levanta correctamente:
  ```bash
  bun run dev
  ```
  - API responde en `localhost:3000`
  - Web responde en `localhost:4321`
- [ ] Correr los tests desde Windows para confirmar que pasan:
  ```bash
  cd apps/api && bun test
  ```
- [ ] Si se usa Docker: verificar que `docker compose up` levanta correctamente con Docker Desktop.

---

## 5.7.4. Configurar flujo de trabajo Git

- [ ] Definir rama principal: `main`.
- [ ] Opcional pero recomendado: usar ramas por feature (`feat/ical-integration`, `feat/mobile-menu`) para las fases siguientes y mergear via PR — da historial limpio aunque se trabaje solo.
- [ ] Verificar que se puede hacer push desde Windows sin problemas de SSH keys (agregar la clave pública de Windows a GitHub si es diferente a la del VPS).

---

## 5.7.5. Smoke test final

- [ ] Desde Windows, hacer un cambio menor (ej.: un comentario en `README.md`), comitearlo y pushearlo.
- [ ] Confirmar que el VPS puede hacer `git pull` y recibir ese cambio.
- [ ] A partir de este punto: **el VPS pasa a ser solo entorno de deploy/producción**; el desarrollo cotidiano se hace desde Windows.

---

## 🟡 Fase 6 — Integración iCal por usuario (Schoology)

**Objetivo:** cada usuario puede vincular su feed iCal/webcal de Schoology y sincronizar eventos hacia el dashboard.

### 6.1. Modelo y DB

- [ ] Extender tabla `users`:
  - Agregar campo `ical_url TEXT` y `last_ical_sync TEXT`.
- [ ] Actualizar `dbService.users`:
  - Permitir leer y actualizar `ical_url` y `last_ical_sync`.

### 6.2. Endpoints de configuración y sync

- [ ] Endpoint para configurar iCal:
  - `PATCH /api/auth/me/ical`:
    - Requiere auth JWT.
    - Body: `{ ical_url: string }`.
    - Valida formato básico de URL.
    - Normaliza `webcal://` a `https://`.
    - Guarda en `users.ical_url` del usuario actual.
- [ ] Servicio de sincronización:
  - Elegir librería iCal compatible con Bun para parsear `.ics`.
  - Endpoint `POST /api/ical/sync`:
    - Requiere auth.
    - Lee `user.ical_url`.
    - Hace fetch del `.ics`.
    - Parsea eventos y:
      - O crea/actualiza `tasks` a partir de ellos.
      - O los guarda en una tabla nueva `external_events` si querés separarlos.

### 6.3. UI

- [ ] En el dashboard, sección “Integraciones” o “Calendario”:
  - Campo para pegar la URL Schoology (webcal/https).
  - Botón “Guardar” (llama a `PATCH /api/auth/me/ical`).
  - Botón “Sincronizar ahora” (llama a `POST /api/ical/sync`).
- [ ] Opcional:
  - Mostrar eventos Schoology mezclados con tareas o en un bloque separado.

### 6.4. Tests para iCal

- [ ] Tests de servicio iCal en API:
  - Normalización `webcal://` → `https://`.
  - Mock de fetch de `.ics` + parser iCal.
  - Conversión de eventos de iCal a `Task` o `external_events`.
- [ ] Tests de endpoints:
  - `PATCH /api/auth/me/ical`:
    - Rechaza URLs inválidas.
    - Guarda/actualiza `ical_url` del usuario autenticado.
  - `POST /api/ical/sync`:
    - Sin `ical_url` → error claro.
    - En `ical_url` válido → crea/actualiza registros esperados.

---

## 🟡 Fase 7 — UX Mobile: nuevo panel flotante (menú `☰`)

**Objetivo:** reemplazar el bottom navbar actual en mobile por un botón flotante tipo menú que despliega un panel grande con las opciones de navegación y acciones.

### 7.1. Diseño del nuevo menú mobile

- [ ] Eliminar/ocultar el bottom‑nav actual en mobile (`DashboardLayout.astro`).
- [ ] Añadir un botón flotante icono `☰` en la esquina inferior derecha:
  - Visible solo en pantallas `< 768px`.
  - Con `aria-label="Abrir menú"` y estado abierto/cerrado manejado desde UI.
- [ ] Crear un panel flotante:
  - Ocupa ancho casi completo con bordes redondeados (similar al screenshot).
  - Fondo oscuro/claro según tema.
  - Animación de aparición (slide/fade).
  - Cierra al tocar fuera o al pulsar “X”.

### 7.2. Contenido del panel

- [ ] Incluir enlaces a:
  - Dashboard
  - Materias / UC
  - Tareas
  - Analíticas
  - Práctica
- [ ] Incluir acciones:
  - `ThemeToggle` (modo claro/oscuro).
  - `LogoutButton`.
- [ ] Asegurar accesibilidad:
  - Focus atrapado dentro del panel cuando esté abierto.
  - `aria-modal="true"` y `role="dialog"`.

### 7.3. Implementación técnica

- [ ] Ajustar `DashboardLayout.astro`:
  - Quitar lógica de bottom‑nav en mobile.
  - Mantener sidebar completa en desktop.
  - Agregar contenedor para botón flotante y panel.
- [ ] Crear un pequeño estado de UI para controlar `isMenuOpen` en mobile.
- [ ] Reusar componentes existentes:
  - `ThemeToggle` y `LogoutButton` dentro del panel.
  - Links con misma estructura/estilos que el sidebar.

---

## 🟡 Fase 8 — Enriquecimiento académico y Tasks avanzadas

### 8.1. Renombrar “Materias” → “UC (Unidad Curricular)”

- [ ] En `/subjects` y textos de UI:
  - Cambiar labels y títulos a “Unidades Curriculares (UC)”.
- [ ] Mantener el modelo `Subject` en código, aclarando en UI que es UC.

### 8.2. Trayecto y Duración en `/subjects`

- [ ] Extender tabla `subjects` y tipo `Subject`:
  - `trayecto TEXT` (ej.: `TFEE`, `TFLDPP`, `TFE`, etc.).
  - `duracion TEXT` (ej.: `Primer semestre`, `Segundo semestre`, `Anual`).
- [ ] Actualizar `SubjectForm`:
  - Añadir selects para Trayecto y Duración (listas cerradas).
- [ ] Mostrar columnas “Trayecto” y “Duración” en la tabla de `/subjects`.

### 8.3. Reglas de clases totales por duración (reglamento CFE)

- [ ] Basarse en el Reglamento CFE (Plan 2023), Art. 28:
  - Las UC semestrales se desarrollan en **15 semanas**.
  - Las UC anuales se desarrollan en **30 semanas**.
- [ ] Definir reglas de sugerencia de `total_classes` usando esas semanas como base (1 clase por semana):
  - Duración = **Anual** → sugerir `total_classes = 30`.
  - Duración = **Semestral** → sugerir `total_classes = 15`.
- [ ] Implementar en `SubjectForm`:
  - Al seleccionar la Duración, si `total_classes` está vacío, autocompletar con el valor sugerido (permitiendo que el usuario lo modifique si tiene más/menos encuentros semanales).
- [ ] Documentar en el código y en el ROADMAP:
  - Que estos valores provienen del Art. 28 del Reglamento CFE (Plan 2023) y representan semanas de curso, no horas exactas.

### 8.4. Nuevos campos en `/tasks` (por UC)

- [ ] Extender tabla `tasks` y tipo `Task`:
  - `type` (individual / grupal).
  - `grade` (1–12, opcional).
  - `file_url` (string, enlace al archivo).
  - `comments` (texto).
- [ ] Ajustar estados de tarea:
  - Estados: `no-iniciado`, `bloqueado`, `en-curso`, `completado`.
  - Mapear a labels en español.
- [ ] Actualizar `TaskForm`:
  - Campos:
    - Tarea (`title`).
    - Tipo (select: Individual / Grupal).
    - Fecha de entrega (`due_date`).
    - Estado (nuevos valores).
    - Calificación (input numérico 1–12).
    - Archivo (input texto para URL).
    - Comentarios (textarea).
- [ ] Actualizar vista `/tasks`:
  - Columnas:
    - Tarea
    - Tipo
    - Fecha de entrega
    - Estado
    - Calificación
    - Archivo (renderizado como link si existe)
    - Comentarios (truncado si es largo).

### 8.5. Promedio de calificación por UC

- [ ] En `SubjectDetail` (o en la tabla `/subjects`):
  - Calcular promedio de `grade` de todas las tareas de esa UC (solo las que tengan nota).
  - Mostrar “Promedio de calificación: X / 12”.
- [ ] Opcional:
  - Mostrar número de tareas calificadas vs. totales.

### 8.6. Integración iCal con `/tasks`

- [ ] Definir mapping iCal → Task:
  - Título de evento → `title`.
  - Fecha de evento → `due_date`.
  - Descripción → `description` o `comments`.
- [ ] UX para asignar UC:
  - Al importar desde iCal, permitir elegir UC manualmente en un paso intermedio, o intentar mapear por nombre.
- [ ] En `/tasks`:
  - Añadir filtro o indicador que distinga:
    - Tareas creadas a mano.
    - Tareas importadas desde iCal.

---

## 🟡 Fase 9 — Planner semanal tipo WeekToDo

**Objetivo:** tener una vista semanal estilo WeekToDo que complemente `/tasks`.

### 9.1. Nueva ruta y layout

- [ ] Crear nueva página `/planner` (o `/week`):
  - Layout con 7 columnas (Lunes–Domingo).
  - Cada columna muestra tareas de ese día (según `due_date`).
- [ ] Fuente de datos:
  - Reutilizar `tasks` existentes, filtradas por la semana actual (lunes–domingo).

### 9.2. Funcionalidad inicial

- [ ] V1:
  - Solo visualización semanal (sin drag & drop).
  - Filtros por UC y por estado (opcional).
- [ ] V2 (futuro):
  - Drag & drop entre columnas:
    - Al mover una tarea a otro día, actualizar `due_date`.
  - Indicadores visuales para tareas importadas desde iCal.

### 9.3. Integración con resto del sistema

- [ ] Desde `/tasks`, botón “Ver semana” que lleva a `/planner`.
- [ ] Desde `/planner`, click en una tarjeta abre el `TaskDetail`.
- [ ] Asegurar que cambios de fecha en el planner se reflejen en `/tasks`, `/analytics` e iCal (si corresponde).

---

## 🟡 Fase 10 — Higiene, tests, calidad y deploy

- [ ] Verificar que los items de la DB estan linkeados por usuario.
- [ ] Verificar si los requerimentos para la migración a Lucia Auth post deploy esta dada.
- [ ] Ejecutar y dejar en verde:
  - `bun run format`.
  - `bun run lint`.
  - `bun run check`.
  - `cd apps/api && bun test`.
  - `cd apps/web && bun run build`.
- [ ] Corregir tipos/imports según herramientas.
- [ ] Verificar que todos los métodos usados en frontend existen en `api.ts`.
- [ ] Revisar que todos los endpoints filtran por `user_id` y respetan ownership.

- [ ] Dominios prod:
  - Web: `https://dashboard.lucasramos.uy`.
  - API: `https://api.lucasramos.uy`.
- [ ] CORS y env vars correctos en prod.
- [ ] Crear (con `seed.ts` o invites) solo:
  - Usuario demo interno (si lo querés conservar).
  - Usuarios reales que invites tú.
- [ ] Smoke test:
  - Registro con invite.
  - Login y uso normal del dashboard.
  - Integración iCal, planner semanal y menú mobile.
- [ ] Lighthouse básico (login y dashboard) y pequeños ajustes de accesibilidad/performance.
