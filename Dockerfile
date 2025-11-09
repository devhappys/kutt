# syntax=docker/dockerfile:1

# ==================== Stage 1: Build Frontend ====================
FROM node:24-alpine AS frontend-builder

# install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/client

# copy frontend package files
COPY client/package.json client/pnpm-lock.yaml ./

# install frontend dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# copy frontend source files
COPY client/ ./

# build frontend
RUN pnpm build

# ==================== Stage 2: Build Backend ====================
FROM node:24-alpine AS backend-builder

# install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# copy root package files
COPY package.json pnpm-lock.yaml ./

# install backend dependencies (production only)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ==================== Stage 3: Production Image ====================
FROM node:24-alpine

# install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# set working directory
WORKDIR /app

# create data directory
RUN mkdir -p /var/lib/hapxs-surl

# copy backend dependencies from builder
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./package.json
COPY --from=backend-builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# copy backend source files
COPY server ./server
COPY custom ./custom
COPY docs ./docs
COPY knexfile.js ./
COPY jsconfig.json ./

# copy built frontend from builder
COPY --from=frontend-builder /app/client/dist ./client/dist

# copy static assets
COPY static ./static

# expose ports
EXPOSE 3000 3001

# set environment variables
ENV NODE_ENV=production

# initialize database and run the app
CMD ["sh", "-c", "node node_modules/.bin/knex migrate:latest && node server/server.js --production"]