#!/usr/bin/env node
/**
 * Renombra CLAVIS → CLAVER en todo el repo (Grupo Claver).
 * Excluye .next, node_modules, agent-tools, binarios.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SKIP_DIRS = new Set([".next", "node_modules", ".git", "agent-tools", "dist", "build"])
const SKIP_FILES = new Set(["tsconfig.tsbuildinfo", "rename-clavis-to-claver.mjs"])
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".mdx",
  ".txt", ".css", ".scss", ".html", ".yml", ".yaml", ".prisma", ".env.example",
])

const FILE_RENAMES = [
  ["components/marketing/clavis-pricing-section.tsx", "components/marketing/claver-pricing-section.tsx"],
  ["lib/opo/clavis-adapter.ts", "lib/opo/claver-adapter.ts"],
  ["__tests__/opo/clavis-adapter.test.ts", "__tests__/opo/claver-adapter.test.ts"],
  ["scripts/generate-clavis-opo-doc.mjs", "scripts/generate-claver-opo-doc.mjs"],
]

function replaceClavis(content) {
  return content
    .replace(/CLAVIS/g, "CLAVER")
    .replace(/Clavis/g, "Claver")
    .replace(/clavis/g, "claver")
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

let changedFiles = 0
let totalReplacements = 0

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file)
  const ext = path.extname(file)
  if (SKIP_FILES.has(path.basename(file))) continue
  if (!TEXT_EXT.has(ext) && !rel.includes(".well-known")) continue
  if (rel.startsWith("scripts" + path.sep) && file.endsWith(".mjs") && rel.includes("rename-clavis")) continue

  const original = fs.readFileSync(file, "utf8")
  if (!/clavis/i.test(original)) continue

  const updated = replaceClavis(original)
  if (updated !== original) {
    const count = (original.match(/clavis/gi) ?? []).length
    fs.writeFileSync(file, updated, "utf8")
    changedFiles++
    totalReplacements += count
    console.log(`  ${rel} (${count})`)
  }
}

console.log(`\nTexto: ${changedFiles} archivos, ~${totalReplacements} reemplazos`)

for (const [from, to] of FILE_RENAMES) {
  const fromPath = path.join(ROOT, from)
  const toPath = path.join(ROOT, to)
  if (fs.existsSync(fromPath)) {
    if (fs.existsSync(toPath)) fs.unlinkSync(toPath)
    fs.renameSync(fromPath, toPath)
    console.log(`Renombrado: ${from} → ${to}`)
  } else if (fs.existsSync(toPath)) {
    console.log(`Ya renombrado: ${to}`)
  } else {
    console.warn(`No encontrado: ${from}`)
  }
}