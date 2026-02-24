FROM oven/bun:1.3.9 AS base

WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN bun install --frozen-lockfile

WORKDIR /app/apps/api

EXPOSE 8787

ENV NODE_ENV=production

CMD ["bun", "run", "src/server.ts"]
