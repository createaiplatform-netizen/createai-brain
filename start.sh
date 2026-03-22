#!/bin/bash
##
# CreateAI Brain — Production Start Script
# Called by Replit deployment as the run command.
#
# Boot order:
#   1. Build checks (api-server + createai-brain frontend)
#   2. api-server starts on API_PORT (8082, internal)
#   3. storefront-server starts on PORT (8080, public → external 80)
#      └─ GET /           → serves index.html (unified storefront)
#      └─ everything else → proxied to api-server on API_PORT
##

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC_PORT="${PORT:-8080}"   # Replit injects PORT; maps to external port 80
API_PORT=8082                 # Internal port — never exposed publicly

echo "[start.sh] CreateAI Brain production boot..."
echo "[start.sh] NODE_ENV: ${NODE_ENV:-production}"
echo "[start.sh] Storefront → :${PUBLIC_PORT} (public)"
echo "[start.sh] API server → :${API_PORT} (internal)"

# ── Build check: api-server ────────────────────────────────────────────────────
cd "$SCRIPT_DIR/artifacts/api-server"
ls dist/index.cjs 2>/dev/null && echo "[start.sh] dist/index.cjs present ✅" || {
  echo "[start.sh] dist/index.cjs MISSING — re-running build..."
  cd "$SCRIPT_DIR"
  pnpm --filter @workspace/api-server run build
  cd "$SCRIPT_DIR/artifacts/api-server"
}

# ── Build check: frontend ──────────────────────────────────────────────────────
ls "$SCRIPT_DIR/artifacts/createai-brain/dist/index.html" 2>/dev/null && echo "[start.sh] frontend dist/ present ✅" || {
  echo "[start.sh] frontend dist/ MISSING — re-running build..."
  cd "$SCRIPT_DIR"
  pnpm --filter @workspace/createai-brain run build
}

# ── Start api-server on internal port ─────────────────────────────────────────
echo "[start.sh] Starting API server on :${API_PORT}..."
PORT=$API_PORT node "$SCRIPT_DIR/artifacts/api-server/dist/index.cjs" &

# Allow api-server time to bind before storefront starts proxying
sleep 3

# ── Start storefront proxy on public port (replaces this shell via exec) ──────
echo "[start.sh] Starting storefront on :${PUBLIC_PORT}..."
exec PORT=$PUBLIC_PORT API_PORT=$API_PORT node "$SCRIPT_DIR/storefront-server.js"
