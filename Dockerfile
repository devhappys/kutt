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
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# set working directory
WORKDIR /app

# create data directory with correct permissions
# Note: node:alpine already has 'node' user with UID/GID 1000
RUN mkdir -p /var/lib/kutt && \
    chown -R node:node /var/lib/kutt && \
    chown -R node:node /app

# copy backend dependencies from builder
COPY --from=backend-builder --chown=node:node /app/node_modules ./node_modules
COPY --from=backend-builder --chown=node:node /app/package.json ./package.json
COPY --from=backend-builder --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml

# copy backend source files
COPY --chown=node:node server ./server
COPY --chown=node:node custom ./custom
COPY --chown=node:node docs ./docs
COPY --chown=node:node knexfile.js ./
COPY --chown=node:node jsconfig.json ./

# copy built frontend from builder
COPY --from=frontend-builder --chown=node:node /app/client/dist ./client/dist

# copy static assets
COPY --chown=node:node static ./static

# copy startup script
COPY --chown=node:node startup.sh ./
RUN chmod +x startup.sh

# expose ports
EXPOSE 3000 3001

# set environment variables
ENV NODE_ENV=production \
    HOME=/app


# switch to non-root user (node user with UID/GID 1000)
USER node

# initialize database and run the app using startup script
CMD ["sh", "./startup.sh"]