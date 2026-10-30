# Deploy HNL XPRESS

Sitio vivo: `https://asdf-883-qwez.duckdns.org`  
Esta máquina (Windows) es el origen: Caddy → BFF `127.0.0.1:8787` → archivos en `WEB_ROOT`.

## Valores (cópialos a `.env`)

```
DEPLOY_USER=root
DEPLOY_HOST=65.109.68.73
DEPLOY_PATH=/var/www/hnl
DEPLOY_DOMAIN=asdf-883-qwez.duckdns.org
WEB_ROOT=C:\Users\desarrollo\webhost\www
EXPO_PUBLIC_API_URL=https://asdf-883-qwez.duckdns.org
```

`DEPLOY_USER` es el usuario SSH del VPS (`root`). Sin esa línea, el script remoto no sabe a quién conectar.

El resto de claves Firebase ya están en `.env` (no las pegues en git).

---

## A) Deploy local (el que usa duckdns ahora)

Desde `d:\Ainfante\Projects\hnl` en PowerShell:

```powershell
cd d:\Ainfante\Projects\hnl
node node_modules/expo/bin/cli export --platform web
Copy-Item -Recurse -Force dist\* C:\Users\desarrollo\webhost\www\
```

O:

```powershell
pnpm run publish:web
```

BFF debe estar arriba:

```powershell
node server/index.mjs
```

Caddy (`C:\Users\desarrollo\webhost\Caddyfile`) hace `reverse_proxy 127.0.0.1:8787`.  
Comprueba: `https://asdf-883-qwez.duckdns.org` (recarga dura).

---

## B) Deploy remoto (VPS)

Requisitos: OpenSSH, clave en `root@65.109.68.73` (login sin contraseña, `BatchMode=yes`).

1. En `.env` las cuatro variables `DEPLOY_*` de arriba.
2. Una vez en el servidor: `bash scripts/install-caddy-site.sh`
3. Desde el proyecto:

```powershell
pnpm run deploy
```

Equivale a: `expo export --platform web`, `scp dist/` → `root@65.109.68.73:/var/www/hnl/`, recarga Caddy.

Si falla `DEPLOY_USER`: falta en `.env` o está vacío. Debe ser `root`.

SSH de prueba:

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=15 root@65.109.68.73 "echo ok"
```
