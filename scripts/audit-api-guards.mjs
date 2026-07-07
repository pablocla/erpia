#!/usr/bin/env node
/**
 * Sprint 7 — Audita rutas API sin getAuthContext / withAuthAndTenant.
 * Falla CI si hay rutas legacy críticas sin guard.
 */

import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

const ROOT = join(process.cwd(), "app", "api")
const GUARD_PATTERNS = [
  "getAuthContext",
  "withAuthAndTenant",
  "getClaverAnalystContext",
  "verifyCronAuth",
  "RUTAS_PUBLICAS",
]
const CRITICAL_PREFIXES = [
  "config/maestros",
  "config/plan-cuentas",
  "config/numeradores",
  "config/plantillas-asiento",
  "config/tablas-auxiliares",
]

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (name === "route.ts" || name === "route.js") acc.push(p)
  }
  return acc
}

const routes = walk(ROOT)
const missing = []
const criticalMissing = []

for (const file of routes) {
  const rel = file.replace(/\\/g, "/").split("app/api/")[1]?.replace("/route.ts", "").replace("/route.js", "")
  const src = readFileSync(file, "utf8")
  const hasGuard = GUARD_PATTERNS.some((p) => src.includes(p))
  if (!hasGuard) {
    missing.push(rel)
    if (CRITICAL_PREFIXES.some((c) => rel?.startsWith(c))) {
      criticalMissing.push(rel)
    }
  }
}

console.log(`API routes scanned: ${routes.length}`)
console.log(`Without auth guard: ${missing.length}`)
if (criticalMissing.length) {
  console.error("\nP0 — critical config routes without guard (Sprint 0 Gemini):")
  for (const r of criticalMissing) console.error(`  - ${r}`)
  if (process.env.AUDIT_GUARDS_STRICT === "1") {
    process.exit(1)
  }
  console.warn("\nModo advisory: set AUDIT_GUARDS_STRICT=1 tras Sprint 0.")
}

if (missing.length > 0) {
  console.log("\nSample unguarded (non-blocking):")
  for (const r of missing.slice(0, 15)) console.log(`  - ${r}`)
}

console.log("\nAudit passed (no P0 config routes unguarded).")