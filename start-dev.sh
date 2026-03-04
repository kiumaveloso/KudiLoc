#!/bin/zsh
# KudiLoc Dev Server — starts MongoDB, the API, and Cloudflare tunnel in one command

API_DIR="$(dirname "$0")/KudivilaATMLocator/ATMLocator.API"
API_PORT=5054
LOG_DIR="/tmp/kudiloc"

mkdir -p "$LOG_DIR"

# ── 1. MongoDB ─────────────────────────────────────────────────────────────────
echo "Starting MongoDB..."
brew services start mongodb/brew/mongodb-community > /dev/null 2>&1

# Wait until MongoDB responds
for i in {1..10}; do
  mongosh --eval "db.runCommand({ping:1})" --quiet > /dev/null 2>&1 && break
  sleep 1
done

if ! mongosh --eval "db.runCommand({ping:1})" --quiet > /dev/null 2>&1; then
  echo "ERROR: MongoDB failed to start. Check brew services."
  exit 1
fi
echo "MongoDB is up."

# ── 2. API ─────────────────────────────────────────────────────────────────────
echo "Starting KudiLoc API..."

# Kill any previous instance on the port
lsof -ti :$API_PORT | xargs kill -9 2>/dev/null

(cd "$API_DIR" && dotnet run --launch-profile external > "$LOG_DIR/api.log" 2>&1) &

# Wait until API is accepting connections
echo -n "Waiting for API"
for i in {1..30}; do
  if curl -s "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
    echo " ready."
    break
  fi
  echo -n "."
  sleep 1
done

if ! curl -s "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
  echo "\nERROR: API failed to start. Check $LOG_DIR/api.log"
  exit 1
fi

# ── 3. Cloudflare Tunnel ───────────────────────────────────────────────────────
echo "Starting Cloudflare tunnel..."

pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

cloudflared tunnel --url http://localhost:$API_PORT --no-autoupdate > "$LOG_DIR/cloudflared.log" 2>&1 &

# Wait for Cloudflare to assign a public URL
for i in {1..15}; do
  PUBLIC_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG_DIR/cloudflared.log" 2>/dev/null | head -1)
  [[ -n "$PUBLIC_URL" ]] && break
  sleep 2
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "ERROR: Cloudflare tunnel failed to start. Check $LOG_DIR/cloudflared.log"
  exit 1
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " KudiLoc is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Public URL : $PUBLIC_URL"
echo " Swagger    : $PUBLIC_URL/swagger"
echo " Health     : $PUBLIC_URL/health"
echo " API logs   : $LOG_DIR/api.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Share the Public URL with the frontend dev."
echo " No special headers needed — just use the URL."
echo " Press Ctrl+C to stop everything."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep script alive and clean up on exit
trap 'echo "\nShutting down..."; pkill -f "cloudflared tunnel"; lsof -ti :'"$API_PORT"' | xargs kill -9 2>/dev/null; echo "Done."' INT TERM
wait
