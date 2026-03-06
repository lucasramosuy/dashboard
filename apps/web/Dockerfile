FROM oven/bun:1.3.9-alpine AS builder

RUN apk add --no-cache python3 make g++ build-base

WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN bun install --frozen-lockfile

WORKDIR /app/apps/web

ARG PUBLIC_API_BASE=https://api.dashboard.lucasramos.uy/api
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE

RUN bun run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Replicación estricta de la estructura del monorepo para SSR
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=node:node /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=node:node /app/apps/web/package.json ./apps/web/

USER node

EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "./apps/web/dist/server/entry.mjs"]
