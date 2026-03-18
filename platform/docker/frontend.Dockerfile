# ─── Frontend Dockerfile ──────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder): Install deps + run Vite build → static files in /dist
#   Stage 2 (runner):  Serve the static files with Nginx (tiny, fast, secure)
#
# Nginx handles:
#   - Serving index.html for all routes (SPA fallback)
#   - Caching static assets
#   - Future: Proxy /api/* to the backend container
#
# Future: Add a custom nginx.conf for production hardening (gzip, cache headers,
#   Content-Security-Policy, HSTS if TLS is terminated here).

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY platform/frontend/package*.json ./
RUN npm ci

COPY platform/frontend/ ./
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: all routes serve index.html so react-router works correctly
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location /api/ {\n\
    proxy_pass http://backend:4000/;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
