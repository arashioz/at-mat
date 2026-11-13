#!/usr/bin/env bash
# One-command Docker deploy for the At-Mat stack. Run from anywhere on the server:
#   ./scripts/docker-deploy.sh
# Requires the root .env, backend/.env and assets/ to exist (they are not in Git).
set -euo pipefail

cd "$(dirname "$0")/.."

fail() { echo "ERROR: $*" >&2; exit 1; }

for file in .env backend/.env assets/image-manifest.json compose.server.yml compose.apps.yml; do
  [ -f "$file" ] || fail "missing $file"
done

wait_http() {
  local url="$1"
  for _ in $(seq 1 30); do
    if curl --fail --silent --output /dev/null "$url"; then
      echo "OK  $url"
      return 0
    fi
    sleep 3
  done
  fail "not responding: $url"
}

docker compose config --quiet
echo "Compose config OK"

docker compose up -d --build --wait --remove-orphans
docker compose ps

wait_http http://127.0.0.1:3010/api/health
wait_http http://127.0.0.1:3001/
wait_http http://127.0.0.1:3002/

echo "Deploy finished at commit $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
