/**
 * Fix double/single UTF-8 mojibake (e.g. FiÃƒÂ¡ → Fiá, â€” → —)
 * Usage: node scripts/fix-mojibake.mjs [--write] [paths...]
 */
import fs from "fs"
import path from "path"

const CP1252_EXTRA = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
}

function toCp1252Bytes(str) {
  const bytes = []
  for (const ch of str) {
    const c = ch.codePointAt(0)
    if (c <= 0xff) bytes.push(c)
    else if (CP1252_EXTRA[c] !== undefined) bytes.push(CP1252_EXTRA[c])
    else return null
  }
  return Buffer.from(bytes)
}

function decodeOnce(str) {
  const buf = toCp1252Bytes(str)
  if (!buf) return null
  try {
    const decoded = buf.toString("utf8")
    if (decoded.includes("\uFFFD")) return null
    return decoded
  } catch {
    return null
  }
}

/** Score: lower is better (fewer mojibake markers) */
function score(s) {
  const markers = (s.match(/Ã.|â.|Â.|ð.|Å.|œ.|¤.|¡.|¢.|£.|¥.|§.|¨.|©.|ª.|«.|¬.|®.|¯.|°.|±.|².|³.|´.|µ.|¶.|·.|¸.|¹.|º.|»./g) || []).length
  const weird = (s.match(/[ÃÂâð]/g) || []).length
  return markers * 3 + weird
}

function fixString(str) {
  let best = str
  let bestScore = score(str)
  let cur = str
  for (let i = 0; i < 4; i++) {
    const next = decodeOnce(cur)
    if (!next || next === cur) break
    cur = next
    const sc = score(cur)
    if (sc < bestScore) {
      best = cur
      bestScore = sc
    }
  }
  return best
}

/** Multi-pass line-by-line + whole-file until score stabilizes */
function fixFileContent(text) {
  let cur = text
  for (let pass = 0; pass < 6; pass++) {
    // Prefer whole-file when uniform double-encoding
    const whole = fixString(cur)
    let next =
      score(whole) < score(cur) && whole.length > cur.length * 0.5
        ? whole
        : cur
            .split("\n")
            .map((line) => {
              const f = fixString(line)
              return score(f) < score(line) ? f : line
            })
            .join("\n")

    // Manual common leftovers if decode misses (emoji / mixed lines)
    const replacements = [
      [/Ã¡/g, "á"], [/Ã©/g, "é"], [/Ã­/g, "í"], [/Ã³/g, "ó"], [/Ãº/g, "ú"],
      [/Ã±/g, "ñ"], [/Ã/g, "Á"], [/Ã‰/g, "É"], [/Ã/g, "Í"], [/Ã“/g, "Ó"],
      [/Ãš/g, "Ú"], [/Ã‘/g, "Ñ"], [/Â¿/g, "¿"], [/Â¡/g, "¡"],
      [/â€”/g, "—"], [/â€“/g, "–"], [/â€˜/g, "‘"], [/â€™/g, "’"],
      [/â€œ/g, "“"], [/â€/g, "”"], [/â€¦/g, "…"], [/â†’/g, "→"],
      [/â‰¤/g, "≤"], [/â‰¥/g, "≥"], [/Ã—/g, "×"], [/Âº/g, "º"],
      [/Â«/g, "«"], [/Â»/g, "»"],
    ]
    let mapped = next
    for (const [re, rep] of replacements) mapped = mapped.replace(re, rep)

    if (mapped === cur) break
    cur = mapped
  }
  return cur
}

const write = process.argv.includes("--write")
const args = process.argv.slice(2).filter((a) => a !== "--write")

const DEFAULT_FILES = [
  "lib/comercial/micro-saas-portfolio.ts",
  "lib/afip/emitir-nota-credito-afip.ts",
  "lib/email/email-service.ts",
  "lib/contabilidad/asiento-service.ts",
  "app/api/impuestos/percepciones/route.ts",
  "app/api/ordenes-pago/[id]/route.ts",
  "docs/qa/COHERENCIA_NAV_RUBRO_NICHOS.md",
]

const files = args.length ? args : DEFAULT_FILES
const root = process.cwd()

let changed = 0
for (const rel of files) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) {
    console.log("SKIP missing", rel)
    continue
  }
  const before = fs.readFileSync(full, "utf8")
  const after = fixFileContent(before)
  if (before === after) {
    console.log("OK unchanged", rel, "score", score(before))
    continue
  }
  console.log(
    (write ? "FIXED" : "DRY") + " " + rel,
    "score",
    score(before),
    "→",
    score(after),
  )
  // Show a couple of sample diffs
  const bLines = before.split("\n")
  const aLines = after.split("\n")
  let shown = 0
  for (let i = 0; i < bLines.length && shown < 5; i++) {
    if (bLines[i] !== aLines[i]) {
      console.log("  -", bLines[i].slice(0, 120))
      console.log("  +", aLines[i].slice(0, 120))
      shown++
    }
  }
  if (write) {
    fs.writeFileSync(full, after, "utf8")
    changed++
  }
}
console.log(write ? `Wrote ${changed} files` : "Dry-run only. Pass --write to apply.")
