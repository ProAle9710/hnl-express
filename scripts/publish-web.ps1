$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
$root = if ($env:WEB_ROOT) { $env:WEB_ROOT } else { "C:\Users\desarrollo\webhost\www" }
node node_modules/expo/bin/cli export --platform web
Copy-Item -Recurse -Force dist\* $root
Write-Host "Publicado en $root"
