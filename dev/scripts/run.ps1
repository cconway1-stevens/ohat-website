# One command to test local changes, staged so you can see exactly where it
# is at any point:
#
#   1. Dependencies  - node_modules and the Playwright browser are installed
#   2. Tests/checks  - prettier, eslint, typecheck (advisory), unit tests,
#                       and a production build + static export as part of that
#   3. Build verify  - confirm the static export in dist/client is present
#   4. Dev server    - boot the app so you can see it in a browser
#
#   .\scripts\run.ps1          run everything, then start dev server
#   .\scripts\run.ps1 -Fix     auto-fix formatting first, then everything
#   .\scripts\run.ps1 -NoDev   run stages 1-3 only, skip the dev server
#   .\scripts\run.ps1 -Redo    wipe node_modules and every generated/cache dir first,
#                      then reinstall from scratch before everything else
param(
    [switch]$Fix,
    [switch]$NoDev,
    [switch]$Redo
)

Set-Location -Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

function Section($title) {
    Write-Host ""
    Write-Host "==== $title ====" -ForegroundColor Cyan
}

# npm scripts in this repo shell out to `bash` (e.g. scripts/pre-push.sh,
# build:static's `STATIC_EXPORT=1 vinext build`). On this machine plain
# `bash` on PATH resolves to the WSL launcher stub, not Git Bash, so route
# npm's script shell there explicitly.
$gitBashDir = "C:\Program Files\Git\bin"
if ((Test-Path "$gitBashDir\bash.exe") -and ($env:PATH -notlike "*$gitBashDir*")) {
    $env:PATH = "$gitBashDir;$env:PATH"
}
$env:npm_config_script_shell = "$gitBashDir\bash.exe"

# ---------------------------------------------------------------------------
Section "1/4 Dependencies"

if ($Redo) {
    Write-Host "-Redo: wiping node_modules and every generated/cache dir..." -ForegroundColor Yellow
    $redoPaths = @(
        "node_modules",
        "dist", ".next", "out", "coverage", ".vercel",
        ".wrangler", ".sites-runtime", ".vinext",
        "public\media\rs", "src\lib\image-manifest.json",
        "tsconfig.tsbuildinfo", "next-env.d.ts"
    )
    $redoFailed = $false
    foreach ($path in $redoPaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force -ErrorAction Stop
            } catch {
                Write-Host "  could not remove ${path}: $($_.Exception.Message)" -ForegroundColor Red
                $redoFailed = $true
            }
        }
    }
    if ($redoFailed) {
        Write-Host "Could not fully wipe generated state - some files are locked, likely by a running dev server or wrangler/miniflare process." -ForegroundColor Red
        Write-Host "Stop that process (check for a lingering 'npm run dev' or vite/wrangler) and re-run -Redo." -ForegroundColor Red
        exit 1
    }
    Write-Host "Wiped. Reinstalling from scratch..." -ForegroundColor Yellow
}

if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules missing - running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

$chromium = Get-ChildItem "$env:LOCALAPPDATA\ms-playwright" -Filter "chromium-*" -Directory -ErrorAction SilentlyContinue
if (-not $chromium) {
    Write-Host "Playwright's Chromium browser missing - installing..." -ForegroundColor Yellow
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Playwright install failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "Dependencies OK (node_modules + Playwright browser present)." -ForegroundColor Green

# ---------------------------------------------------------------------------
Section "2/4 Tests & checks"

if ($Fix) {
    npm run check -- --fix
} else {
    npm run check
}
$checkExit = $LASTEXITCODE

if ($checkExit -ne 0) {
    Write-Host ""
    Write-Host "Some checks failed - see above." -ForegroundColor Red
    Write-Host "(Known exception: 'only the latin font subset is preloaded' fails on Windows due to an upstream vinext path bug - not your code, safe to ignore locally.)" -ForegroundColor Yellow
    exit $checkExit
}

# ---------------------------------------------------------------------------
Section "3/4 Build verify"

if (Test-Path "dist\client\index.html") {
    $pageCount = (Get-ChildItem "dist\client" -Recurse -Filter "*.html").Count
    Write-Host "dist/client present - $pageCount HTML pages exported by the checks above." -ForegroundColor Green
} else {
    Write-Host "dist/client missing after checks passed - something is wrong, investigate." -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
Section "4/4 Dev server"

if ($NoDev) {
    Write-Host "Skipping dev server (-NoDev)."
    exit 0
}

Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev
