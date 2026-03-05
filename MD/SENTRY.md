# Documentación de Sentry

Esta guía detalla la implementación de Sentry en el monorepo para la trazabilidad de errores, de acuerdo con las Fases 11, 12 y 13 del ROADMAP.

## Fase 11 — Sentry en Frontend (Astro/React)

1. **Configuración Astro:** Se utiliza `@sentry/astro` que se inicializa en `astro.config.mjs` y se configura vía `sentry.client.config.ts` y `sentry.server.config.ts`. Este paquete ya está provisto y captura errores de renderizado y las requests no manejadas a nivel de Astro.
2. **API Client (`apps/web/src/lib/api.ts`):** Las fallas en la red y respuestas HTTP de error (`!response.ok`) son explícitamente enviadas a Sentry utilizando `Sentry.captureException()`.
3. **React Error Boundary (`AppShell.tsx`):** Se ha instalado `@sentry/react` y se envuelve la jerarquía de Contexts (React) dentro de un `<Sentry.ErrorBoundary>` para capturar errores de UI en componentes React y evitar pantallas en blanco, mostrando una notificación de error para que el usuario recargue.

---

## Fase 12 — Sentry en Backend (Bun)

1. **Dependencias:** Sentry se ha integrado a través de la instalación nativa de `@sentry/bun`.
2. **Setup Global Runtime:** En el archivo `apps/api/src/instrument.ts` se invoca `Sentry.init(...)` lo más pronto posible en el ciclo de vida del proceso de Bun. Esto permite rastrear crash dumps a nivel de runtime, rejections de promesas que han escapado de los scopes async, y el uso nativo de recursos. Esta instanciación se inyecta desde la primera línea del servidor en `src/server.ts`.
3. **Manejo Específico en la API (Hono):** Dentro de `src/server.ts` se instancia un segundo cliente independiente de Sentry explícitamente designado para operaciones HTTP (`new Sentry.BunClient()`).
   - Los fallos capturados en los endpoints se elevan mediante el manejador global de excepciones en Hono `app.onError()`.
   - **Enriquecimiento del Contexto:** Antes de enviar el error, Hono usa `auth.api.getSession()` para interceptar el token/cookie en los headers en crudo del request (`c.req.raw.headers`), obteniendo datos del usuario afectado (id, email) y los inyecta junto con el método y la ruta que falló en los _tags_ y _extras_ del evento enviado a Sentry. Esto permite buscar en el panel por _User ID_ cuando ocurre un 500.

---
