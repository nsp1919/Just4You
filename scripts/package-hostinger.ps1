<#
  package-hostinger.ps1
  Builds the Just4You monorepo and assembles a clean, ready-to-upload
  deployment package for Hostinger Node.js hosting.

  Output: just4you-hostinger.tar.gz  (in the repo root)

  What it does:
    1. Builds the web + birthday apps (turbo run build)
    2. Stages only the files Hostinger needs (no node_modules, no caches)
    3. Creates a Linux-safe tar.gz archive of the staging folder

  On Hostinger you then: upload + extract, run `npm install`, and set the
  startup file to server.js (main domain) / server_wish.js (subdomain).
#>

$ErrorActionPreference = "Stop"

# Repo root = parent of this script's folder
$root  = Split-Path -Parent $PSScriptRoot
$stage = Join-Path $root "build\hostinger-package"
# Use tar.gz (NOT .zip): Windows Compress-Archive writes backslash path
# separators that break when extracted on Linux (files become flat names
# like "server\chunk.js" instead of a server/ folder). tar uses forward
# slashes and preserves the real directory structure.
$tgz   = Join-Path $root "just4you-hostinger.tar.gz"

Write-Host "==> Repo root: $root" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. Build
# ---------------------------------------------------------------------------
Write-Host "==> Building apps (turbo run build)..." -ForegroundColor Cyan
Push-Location $root
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# 2. Stage
# ---------------------------------------------------------------------------
Write-Host "==> Staging files..." -ForegroundColor Cyan
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

# Root-level files required at runtime
$rootFiles = @(
    "package.json",
    "package-lock.json",
    "turbo.json",
    "server.js",
    "server_wish.js",
    "post-build.js",
    "firebase.json",
    "firestore.rules"
)
foreach ($f in $rootFiles) {
    $src = Join-Path $root $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $stage $f) -Force
        Write-Host "    + $f"
    } else {
        Write-Host "    - $f (missing, skipped)" -ForegroundColor Yellow
    }
}

# robocopy exit codes 0-7 indicate success; >=8 is an error.
function Copy-Tree($srcDir, $destDir, [string[]]$excludeDirs, [string[]]$excludeFiles) {
    $args = @($srcDir, $destDir, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")
    if ($excludeDirs.Count -gt 0) { $args += "/XD"; $args += $excludeDirs }
  if ($excludeFiles.Count -gt 0) { $args += "/XF"; $args += $excludeFiles }
    robocopy @args | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($srcDir) exit=$LASTEXITCODE" }
    $global:LASTEXITCODE = 0
}

# apps/web — keep .next build but drop node_modules and dev/build caches
Copy-Tree (Join-Path $root "apps\web") (Join-Path $stage "apps\web") @(
    (Join-Path $root "apps\web\node_modules"),
    (Join-Path $root "apps\web\.turbo"),
    (Join-Path $root "apps\web\.next\cache"),
    (Join-Path $root "apps\web\.next\dev")
) @(".env.local", ".env.*.local")
Write-Host "    + apps/web"

# apps/birthday - keep .next build but drop node_modules and dev/build caches
# (.next/dev is Turbopack's dev-mode cache - hundreds of MB, not used in prod)
Copy-Tree (Join-Path $root "apps\birthday") (Join-Path $stage "apps\birthday") @(
    (Join-Path $root "apps\birthday\node_modules"),
    (Join-Path $root "apps\birthday\.turbo"),
    (Join-Path $root "apps\birthday\.next\cache"),
    (Join-Path $root "apps\birthday\.next\dev")
) @(".env.local", ".env.*.local")
Write-Host "    + apps/birthday"

# packages/shared - needed for the workspace symlink / install
Copy-Tree (Join-Path $root "packages\shared") (Join-Path $stage "packages\shared") @(
    (Join-Path $root "packages\shared\node_modules"),
    (Join-Path $root "packages\shared\.turbo")
) @()
Write-Host "    + packages/shared"

# Short plaintext deploy guide inside the package
$readme = @"
Just4You - Hostinger deployment package
========================================

Two Node.js apps to deploy:
  - Main domain      -> startup file: server.js       (web app,  Next 15)
  - Wish subdomain   -> startup file: server_wish.js  (birthday, Next 16)

Steps (Hostinger hPanel -> Advanced -> Node.js):
  1. Upload + extract this package into your app's root folder.
  2. Create a Node.js Application:
        Application root  = the extracted folder
        Startup file      = server.js
        Node version      = 20 or newer
  3. Click "Run npm install" (installs all workspace dependencies).
  4. Set Environment Variables in hPanel's Node.js app settings.
     Local .env files are intentionally excluded from this package.
  5. Start the application.
  6. For the birthday/wish pages, create a SECOND Node.js Application on the
     subdomain with Startup file = server_wish.js (same steps).

Notes:
  - node_modules is intentionally excluded - Hostinger installs it.
  - The .next production build IS included, so no build step is needed on
    the server.
  - Set the same RAZORPAY_WEBHOOK_SECRET here and in the Razorpay Dashboard
    webhook (URL: https://<your-domain>/api/payment/webhook, event:
    payment.captured).
"@
Set-Content -Path (Join-Path $stage "DEPLOY-HOSTINGER.txt") -Value $readme -Encoding UTF8
Write-Host "    + DEPLOY-HOSTINGER.txt"

# ---------------------------------------------------------------------------
# 3. Archive (tar.gz - Linux-safe, preserves directory structure)
# ---------------------------------------------------------------------------
Write-Host "==> Creating tar.gz..." -ForegroundColor Cyan
if (Test-Path $tgz) { Remove-Item $tgz -Force }
tar -czf $tgz -C $stage .
if ($LASTEXITCODE -ne 0) { throw "tar failed with exit code $LASTEXITCODE" }

$sizeMb = [math]::Round((Get-Item $tgz).Length / 1MB, 1)
Write-Host ""
Write-Host "Done -> $tgz ($sizeMb MB)" -ForegroundColor Green
Write-Host "Staging folder kept at: $stage" -ForegroundColor DarkGray
Write-Host ""
Write-Host "On the server, extract with:" -ForegroundColor Cyan
Write-Host "  tar -xzf just4you-hostinger.tar.gz -C <app-folder>" -ForegroundColor Gray
