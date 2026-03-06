# Se utiliza la imagen slim (Debian) provista por oven/bun
FROM oven/bun:1.3.9-slim AS base

# Instalar dependencias nativas del sistema operativo mediante APT
RUN apt-get update && apt-get install -y python3 make g++ build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Transferir la propiedad del directorio de trabajo al usuario bun previo a operar
RUN chown -R bun:bun /app

# Cambiar a usuario sin privilegios
USER bun

# Copiar archivos manifest con permisos exactos
COPY --chown=bun:bun package.json bun.lockb* ./
COPY --chown=bun:bun packages/ ./packages/
COPY --chown=bun:bun apps/api/ ./apps/api/

# Instalar dependencias; Bun descargará la variante linux-x64-glibc para @libsql
RUN bun install --frozen-lockfile

# Definir el contexto de ejecución
WORKDIR /app/apps/api

EXPOSE 8787

ENV NODE_ENV=production

CMD ["bun", "run", "src/server.ts"]