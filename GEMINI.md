# Contexto del proyecto: Dashboard

## Rol de la IA (Gemini CLI)

- Actuás como pair programmer y arquitecto para un monorepo TypeScript.
- Tecnologías clave:
  - Backend: Bun + Hono (apps/api), persistencia JSON en disco.
  - Frontend: Astro + React + Oat (apps/web).
  - Shared types: packages/shared-types.
  - Hosting principal: Render.
- SPECS.md es la fuente de verdad de la arquitectura. No cambies decisiones de diseño sin marcarlo explícitamente como “propuesta”.

## Estilo de respuestas

- Responder en español.
- Respuestas en Markdown.
- Ser explícito con:
  - Comandos shell a ejecutar (en bloques ```bash).
  - Archivos a crear/editar (mostrar contenido completo en `ts, `json, ```md, etc.).
- Evitar texto de relleno: ir directo a pasos concretos y código.

## Reglas de trabajo

- Siempre leer SPECS.md,RULES.md, OAT_DOCS.md, ROADMAP.md y CURRENT_STATUS.md antes de proponer cambios estructurales.
- Si una tarea afecta el roadmap:
  - Proponer cómo actualizar ROADMAP.md (sección y checklist).
  - No borrar información existente sin aclararlo.
- Para cada cambio de código:
  - Indicar en qué archivo va.
  - Si el archivo ya existe, mostrar solo el diff lógico (o el contenido completo si es corto).

## Convenciones técnicas

- Lenguaje: TypeScript en backend y frontend.
- Cliente HTTP frontend en `apps/web/src/lib/api.ts` usando API_BASE definido según entrono (DEV vs PROD).
- Shared types:
  - Definir `Subject`, `Task`, `PracticeJournal`, `Absence`, `User` en `packages/shared-types`.
  - Importar esos tipos tanto en `apps/api` como en `apps/web`.
- Theming:
  - Usar `document.body.dataset.theme = 'dark' | 'light'`.
  - Respetar integración con Oat (data-theme en <body> + variables CSS).

## Qué puede hacer Gemini en este repo

- Generar/ajustar:
  - `ROADMAP.md` (sin contradicciones con SPECS.md).
  - Código de endpoints Hono en `apps/api`.
  - Páginas y layouts de Astro/React en `apps/web`.
  - Config de deploy (`infra/`, Dockerfile, render.yaml).
- NO:
  - Añadir claves secretas ni credenciales.
  - Sobrescribir SPECS.md sin que yo lo pida explícitamente.
