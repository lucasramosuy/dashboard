FROM oven/bun:1.3.9 AS base

WORKDIR /app

# Copiar archivos con el propietario correcto
COPY --chown=bun:bun package.json bun.lockb* ./
COPY --chown=bun:bun packages/ ./packages/
COPY --chown=bun:bun apps/api/ ./apps/api/

RUN bun install --frozen-lockfile

# Asegurar que el directorio de trabajo tenga los permisos correctos
WORKDIR /app/apps/api

# Cambiar a usuario no-root
USER bun

EXPOSE 8787

ENV NODE_ENV=production

CMD ["bun", "run", "src/server.ts"]
