#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DEPLOY_HOST:=65.109.68.73}"
: "${DEPLOY_PATH:=/var/www/hnl}"
: "${DEPLOY_DOMAIN:=asdf-883-qwez.duckdns.org}"
: "${DEPLOY_USER:=root}"
ssh_opts=(-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)

pnpm install --frozen-lockfile
pnpm exec expo export --platform web

ssh "${ssh_opts[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_PATH}'"
scp "${ssh_opts[@]}" -r dist/. "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
scp "${ssh_opts[@]}" deploy/Caddyfile "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/hnl.Caddyfile"
ssh "${ssh_opts[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "sudo mkdir -p /etc/caddy/sites && sudo cp /tmp/hnl.Caddyfile /etc/caddy/sites/hnl.caddy && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy"

echo "Publicado en https://${DEPLOY_DOMAIN}"
