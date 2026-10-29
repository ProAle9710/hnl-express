$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (Test-Path .env) {
  Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $pair = $_ -split '=', 2
    $name = $pair[0].Trim()
    $value = $pair[1].Trim()
    if ($name) { Set-Item -Path "Env:$name" -Value $value }
  }
}

if (-not $env:DEPLOY_HOST) { $env:DEPLOY_HOST = "65.109.68.73" }
if (-not $env:DEPLOY_PATH) { $env:DEPLOY_PATH = "/var/www/hnl" }
if (-not $env:DEPLOY_DOMAIN) { $env:DEPLOY_DOMAIN = "asdf-883-qwez.duckdns.org" }
if (-not $env:DEPLOY_USER) { throw "Define DEPLOY_USER en .env" }

pnpm install --frozen-lockfile
pnpm exec expo export --platform web

ssh "$($env:DEPLOY_USER)@$($env:DEPLOY_HOST)" "mkdir -p '$($env:DEPLOY_PATH)'"
scp -r dist/. "$($env:DEPLOY_USER)@$($env:DEPLOY_HOST):$($env:DEPLOY_PATH)/"
scp deploy/Caddyfile "$($env:DEPLOY_USER)@$($env:DEPLOY_HOST):/tmp/hnl.Caddyfile"
ssh "$($env:DEPLOY_USER)@$($env:DEPLOY_HOST)" "sudo mkdir -p /etc/caddy/sites && sudo cp /tmp/hnl.Caddyfile /etc/caddy/sites/hnl.caddy && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy"

Write-Host "Publicado en https://$($env:DEPLOY_DOMAIN)"
