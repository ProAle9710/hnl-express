#!/usr/bin/env bash
# Una vez en el servidor. El Caddyfile principal debe importar este sitio.
set -euo pipefail
sudo mkdir -p /var/www/hnl /etc/caddy/sites
sudo cp deploy/Caddyfile /etc/caddy/sites/hnl.caddy
MAIN=/etc/caddy/Caddyfile
if ! grep -q 'import /etc/caddy/sites/\*' "$MAIN"; then
  printf '\nimport /etc/caddy/sites/*\n' | sudo tee -a "$MAIN" >/dev/null
fi
sudo caddy validate --config "$MAIN"
sudo systemctl reload caddy
