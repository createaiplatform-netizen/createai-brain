# ─── Backend Dockerfile ───────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder): Install deps + compile TypeScript → JavaScript
#   Stage 2 (runner):  Minimal image with only production deps + compiled output

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY platform/backend/package*.json ./
RUN npm ci

COPY platform/backend/ ./
RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Run as non-root user for security hardening.
# The 'node' user (uid 1000) is included in node:alpine images.
RUN chown -R node:node /app
USER node

COPY --from=builder --chown=node:node /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
