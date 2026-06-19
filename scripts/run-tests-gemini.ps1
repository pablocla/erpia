# ERP Argentina — Test runner para Gemini / CI local
# Uso: powershell -ExecutionPolicy Bypass -File scripts/run-tests-gemini.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== ERP Argentina — Verificación Gemini ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Instalando dependencias (si faltan)..." -ForegroundColor Yellow
npm install --silent 2>$null

Write-Host "[2/4] Generando Prisma Client..." -ForegroundColor Yellow
npx prisma generate --silent

Write-Host "[3/4] Tests unitarios (Vitest)..." -ForegroundColor Yellow
npm run test:gemini
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[4/4] Build de producción..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== TODO OK — $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" -ForegroundColor Green