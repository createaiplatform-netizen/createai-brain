# ─── Backend Dockerfile ───────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder): Install deps + compile TypeScript → JavaScript
#   Stage 2 (runner):  Copy only the compiled output + production deps
#
# This keeps the final image small (~200MB vs ~600MB with devDeps).
#
# Future: Add a non-root USER for security hardening.
# Future: Add HEALTHCHECK instruction (already handled by docker-compose).
# Future: Pin the Node version to match your production environment exactly.

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

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
