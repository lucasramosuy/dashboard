FROM oven/bun:1.3.9 AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN bun install --frozen-lockfile

WORKDIR /app/apps/web

# PUBLIC_API_BASE se inyecta en build time (queda bakeado en el JS)
ARG PUBLIC_API_BASE=https://api.dashboard.lucasramos.uy/api
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE

RUN bun run build

# Runtime — Node para Astro SSR
FROM node:20-alpine AS runtime

WORKDIR /app

# Copiar con cambio de propietario a node
COPY --from=builder --chown=node:node /app/apps/web/dist ./dist

# Cambiar a usuario no-root
USER node

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "./dist/server/entry.mjs"]
