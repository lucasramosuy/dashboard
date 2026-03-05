# RULES.md – Reglas Inquebrantables de Desarrollo

Este archivo define las restricciones técnicas y de estilo para el **Dashboard**.
**Gemini** debe seguir estas reglas estrictamente.

---

## 1. Ecosistema y Runtime (Bun)

- **Runtime único:** Usar exclusivamente APIs de Bun.
  Prohibido usar APIs de Node.js (ej. `fs`, `path`) si existe una alternativa en Bun (`Bun.file`, `Bun.write`, `import.meta.dir`).

- **Gestión de paquetes:** Usar siempre `bun install` y `bun run`.
  No generar archivos `package-lock.json` (usar `bun.lock`).

---

## 2. Frontend (Astro + React + Tailwind CSS)

- **Prioridad de UI (Tailwind CSS):**
  - El modelo mental y visual depende exclusivamente de Tailwind.
  - Todo trabajo de CSS o estilado nuevo debe pasar por clases utilitarias en React o Astro, limitando el uso de `theme.css` a `tailwind base`.
  - Se abandonó Oat UI. No agregar dependencias, CDN ni utilidades vinculadas a la misma.

- **Uso de React:**
  - Usar React solo para componentes que requieren estado complejo o interactividad (formularios, modales, gráficos).
  - Utilizar React intensivamente para componentes de interfaz repetibles (`/apps/web/src/components/ui/Button.tsx`, etc.).
  - Todo componente React en Astro debe llevar la directiva `client:load` o `client:visible` según corresponda para asegurar la interactividad.

- **Theming:**
  - La config de tailwind debe incluir `darkMode: ['class', '[data-theme="dark"]']`
  - El tema se controla vía `document.body.dataset.theme` para activar las clases `dark:`.

---

## 3. Backend (Hono + SQLite/Turso)

- **Persistencia:** La base de datos es **SQLite** local en desarrollo y **Turso** (LibSQL) en producción.
  Se accede vía `@libsql/client` a través de `dbService` en `lib/db.ts`.
  Importante: Al leer fechas de SQLite, convertirlas explícitamente a objetos `Date` si el tipo de TS así lo requiere.

- **Auth:** Gestionado por **Better Auth** (`lib/auth.better.ts`). No implementar auth custom.

- **CORS:** Siempre permitir el origen del frontend en desarrollo (`http://localhost:4321`). Controlado por `CORS_ORIGINS`.

---

## 4. Arquitectura Monorepo y Tipado

- **Single Source of Truth:** Los tipos residen en `packages/shared-types`.
  No duplicar interfaces en `apps/web` o `apps/api`.

- **Imports:** Usar el alias `@dashboard/shared-types` para importar tipos.

- **Strict TypeScript:** No usar `any`.
  Si un tipo es desconocido tras un `fetch`, definir un esquema o interfaz de respaldo.

---

## 5. Convenciones de Código

- **Async/Await:** Preferir siempre sobre `.then()`.

- **Exportaciones:** Usar exportaciones nombradas (`export const ...`) en lugar de `export default`
  para facilitar el refactor y el autocompletado.
