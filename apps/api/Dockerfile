FROM oven/bun:1.3.9-alpine AS base

RUN apk add --no-cache python3 make g++ build-base

WORKDIR /app

# Transferencia de propiedad previa a operaciones para evitar EACCES
RUN chown -R bun:bun /app

# Transición a usuario sin privilegios
USER bun

COPY --chown=bun:bun package.json bun.lockb* ./
COPY --chown=bun:bun packages/ ./packages/
COPY --chown=bun:bun apps/api/ ./apps/api/

# Instalación con usuario y grupo correctos
RUN bun install --frozen-lockfile

WORKDIR /app/apps/api

EXPOSE 8787
ENV NODE_ENV=production

CMD ["bun", "run", "src/server.ts"]
