#!/usr/bin/env bash
# Start Home Operations, then open it in the default browser.
set -euo pipefail

cd "$(dirname "$0")"

# Load optional local settings (PORT, HOST, API key, ...).
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

PORT="${PORT:-3000}"
URL="http://localhost:${PORT}"

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  fi
}

# Already running? Just show it.
if command -v curl >/dev/null 2>&1 && curl -fsS "$URL/" >/dev/null 2>&1; then
  open_browser
  exit 0
fi

if [ ! -d node_modules ]; then
  npm install
fi

if [ ! -f build/handler.js ]; then
  npm run build
fi

(
  for _ in $(seq 1 40); do
    if curl -fsS "$URL/" >/dev/null 2>&1; then
      open_browser
      exit 0
    fi
    sleep 0.25
  done
) &

exec node server.js
