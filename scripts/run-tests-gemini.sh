#!/usr/bin/env bash
# ERP Argentina — Test runner para Gemini / CI local
# Uso: bash scripts/run-tests-gemini.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== ERP Argentina — Verificación Gemini ==="
echo ""

echo "[1/4] Instalando dependencias..."
npm install --silent

echo "[2/4] Generando Prisma Client..."
npx prisma generate

echo "[3/4] Tests unitarios (Vitest)..."
npm run test:gemini

echo ""
echo "[4/4] Build de producción..."
npm run build

echo ""
echo "=== TODO OK — $(date '+%Y-%m-%d %H:%M') ==="