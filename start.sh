#!/bin/bash
##
# CreateAI Brain — Production Start Script
# Called by Replit deployment as the run command.
# The API server (port 8080) serves the compiled React frontend
# via the built-in selfHostEngine.
##

set -e

echo "[start.sh] CreateAI Brain production boot..."
echo "[start.sh] NODE_ENV: ${NODE_ENV:-production}"
echo "[start.sh] PORT: ${PORT:-8080}"

# Must cd into api-server directory so selfHostEngine resolves
# ../../artifacts/createai-brain/dist relative path correctly.
cd "$(dirname "$0")/artifacts/api-server"

echo "[start.sh] cwd: $(pwd)"
echo "[start.sh] Checking dist/..."
ls dist/index.cjs 2>/dev/null && echo "[start.sh] dist/index.cjs present ✅" || {
  echo "[start.sh] dist/index.cjs MISSING — re-running build..."
  cd ../..
  pnpm --filter @workspace/api-server run build
  cd artifacts/api-server
}

echo "[start.sh] Checking frontend dist/..."
ls ../../artifacts/createai-brain/dist/index.html 2>/dev/null && echo "[start.sh] frontend dist/ present ✅" || {
  echo "[start.sh] frontend dist/ MISSING — re-running build..."
  cd ../..
  pnpm --filter @workspace/createai-brain run build
  cd artifacts/api-server
}

echo "[start.sh] Starting API server on port ${PORT:-8080}..."
exec node dist/index.cjs
