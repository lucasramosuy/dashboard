# Especificación de requisitos de software: Dashboard

**Estado:** rama `dev` al 27/09/2026 (`353b38b`). Este documento describe el producto implementado; `MD/SPECS.md` registra objetivos de una migración anterior y `MD/ROADMAP.md` no equivale a funciones ya entregadas.

## Propósito y alcance

Dashboard ayuda a estudiantes de formación docente (CFE) a organizar unidades curriculares (UC), asistencia, tareas, notas, planificación semanal, diario de práctica y eventos importados de Schoology. El alcance actual es el uso estudiantil; no incluye gestión docente de grupos. Existe acceso de administración para invitaciones y mantenimiento, no registro público abierto.

## Requisitos funcionales

- **RF-01. Acceso:** iniciar y cerrar sesión con Better Auth; registrar usuarios solo mediante un código de invitación de un uso. Bloquear la ruta pública de sign-up. Permitir consultar/cerrar sesiones y configurar credenciales desde el perfil; exigir Turnstile en login y registro según configuración.
- **RF-02. UC:** crear y editar UC propias, consultar detalle, registrar faltas (incluidas justificadas), notas y tareas asociadas. Calcular asistencia y mostrar riesgo según el umbral de 75% de asistencia; la falta justificada cuenta 0,5 en el cálculo actual.
- **RF-03. Tareas:** crear, editar, completar y filtrar por estado, vencimiento y UC; registrar fechas de entrega, notas y detalles. Reflejar pendientes, próximas entregas y tareas atrasadas en Inicio.
- **RF-04. Planner:** mostrar semana con tareas y eventos importados, y permitir reprogramar tareas mediante arrastre sin convertir eventos externos en tareas.
- **RF-05. Diario:** guardar y consultar entradas de práctica por día, con especialidad en texto libre.
- **RF-06. Analíticas:** mostrar asistencia por UC, promedio por UC y entregas por semana; manejar estados sin datos y de carga sin mostrar números ficticios.
- **RF-07. Schoology:** aceptar una URL privada de feed iCal por usuario, sincronizar manualmente y en el cron diario de medianoche de Montevideo. Reemplazar eventos importados en cada sincronización, descartar los de más de 30 días y mostrarlos en Inicio, Planner y Schoology. El parser actual no expande `RRULE`.
- **RF-08. Administración:** limitar `/panel/admin` a los correos configurados en `ADMIN_EMAILS`, con control de passkey para la sesión de administración. Crear y anular invitaciones, ver usuarios y registro de acciones, y restablecer contraseñas según las funciones existentes; no registrar códigos o contraseñas temporales en logs públicos.
- **RF-09. Avisos:** enviar por el bot de Telegram existente el resumen diario (solo si hay contenido), novedades del iCal y fallas operativas configuradas; sin credenciales de Telegram, omitir el envío sin afectar la app.

## Datos y fronteras

La API Hono y la web Astro/React comparten tipos en `packages/shared-types`. libSQL usa SQLite en desarrollo/pruebas y Turso en producción. Las tablas principales son `user`, `session`, `account`, `verification`, `passkey`, `rateLimit`, `subjects`, `absences`, `tasks`, `practice_journals`, `invites`, `ical_events` y `admin_log`. Los registros de UC, tareas, faltas, diario y eventos deben quedar ligados al usuario correspondiente. La URL iCal es privada y las claves de sesión/base de datos son secrets, nunca contenido del repositorio ni de respuestas públicas.

## Requisitos no funcionales y operaciones

- Producción: un Cloudflare Worker bajo `/panel` sirve web y API en el mismo origen; Turso alberga datos. Monorepo Bun con Astro, React, Hono y TypeScript. `dev` recibe PR y `prod` se publica tras el PR dev→prod que fusiona Lucas. No publicar este documento por push directo a `prod`.
- Mantener la aplicación dentro de los límites gratuitos de Workers y Turso: PBKDF2-WebCrypto para contraseñas en el runtime Worker, límites de tamaño de peticiones, rate limiting y aislamiento del preview. El preview por PR usa otra base demo, nunca Turso de producción; registro abierto continúa deshabilitado.
- Sesiones autenticadas y secretos protegidos; validación del lado servidor y CORS restringido. Sentry recibe errores; no revelar detalles internos en respuestas de error. La PWA tiene manifest pero no service worker: requiere conexión.
- Automatización: cron iCal a las 03:00 UTC y resumen a las 10:00 UTC, equivalentes a medianoche y 07:00 de Montevideo en el horario actual. Backup semanal cifrado en artifact y prueba mensual de restore en base temporal; esta prueba no restaura producción.
- Antes de integrar cambios de comportamiento, ejecutar CI (`bun run test`, `bun run check`, build) y smoke test tras deploy. El deploy a `prod` corre migraciones, build y publicación; un merge a `dev` no es publicación.

## Ajuste de login (PR pendiente)

Sin cambiar las protecciones: no refetchear la sesión antes de la navegación
posterior al login con contraseña. Registrar fallos por cuenta mediante UPSERT
atómico compartido, preservando el umbral de 5 y la ventana de 15 minutos. Mantener
el DELETE incondicional tras un login correcto para limpiar también fallos que
hayan llegado concurrentemente. El rate limit distribuido en DB y Turnstile
fail-closed se conservan.


## CRM fase 7: pipeline de tareas

Vista alternativa a la lista con cuatro columnas: pendiente (`todo`), en curso (`in-progress`), entregada (`done` sin nota) y calificada (`done` con nota, incluido cero). Es una proyección de campos existentes: no agrega estados ni modifica DB/API. Abrir Pipeline selecciona Todas para no ocultar entregadas/calificadas; los filtros de UC, búsqueda y estado siguen disponibles. Abrir lleva a la ficha; Editar usa el formulario existente para estado/nota, sin arrastrar ni cambios automáticos.
## CRM fase 6: próxima acción

La home destaca una tarea pendiente (incluido planner) con acceso a su ficha. Prioriza la fecha más antigua: vencidas antes de próximas; a igual fecha, en curso antes de pendiente, luego ID estable. Indica plazo y UC si existe. No usa puntajes inventados ni marca entregas automáticamente. Sin pendientes muestra un estado vacío explícito. Sin cambios de API ni DB.

## CRM fase 8: feed DB/API

Registro automático y atómico de cambios de UC, tareas, faltas y prácticas. No cuenta ediciones sin cambios ni inventa eventos anteriores a la migración. API autenticada aislada por usuario, ventana hoy/semana calendario Montevideo y límite 1-100 con indicador de recorte. Etiquetas acotadas, sin cuerpos privados. No introduce costos ni servicios nuevos; despliegue requiere la migración idempotente en Turso antes del Worker. La UI no forma parte de este PR de backend.

## CRM fase 9: panel autónomo

Feed visual en home y resumen semanal privado generado por el Worker domingo20UY. Una invocación por semana, mismo criterio de salud que la home/ficha y sin mensajes externos. Snapshot por usuario, sin contaminación entre cuentas, retención12semanas, vacío antes del primer cron, error distinguible de ausencia de datos. Worker y Bun usan0 23 * * 0 UTC; preview conserva crons vacíos. No se cambia el envío diario existente de Telegram.
