/**
 * Valida demos por rubro (provision + checks DB).
 * Opcional: informe Gemini si hay GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY.
 *
 * Uso:
 *   npx tsx scripts/validate-industry-demos.ts
 *   npx tsx scripts/validate-industry-demos.ts almacen gimnasio
 *   npx tsx scripts/validate-industry-demos.ts --gemini
 *   npx tsx scripts/validate-industry-demos.ts --keep
 */

import { validateFeaturedDemos } from "../lib/comercial/demo-health-validator"
import { auditDemosWithGemini } from "../lib/comercial/demo-gemini-auditor"

async function main() {
  const args = process.argv.slice(2)
  const withGemini = args.includes("--gemini")
  const keepTenant = args.includes("--keep")
  const industryIds = args.filter((a) => !a.startsWith("--"))

  console.log("=== Claver demo health validator ===\n")

  const { reports, summary } = await validateFeaturedDemos({
    industryIds: industryIds.length ? industryIds : undefined,
    skipHttp: true,
    keepTenant,
  })

  for (const r of reports) {
    const icon = r.verdict === "auto" ? "OK " : r.verdict === "needs_analyst" ? "WRN" : "FAIL"
    console.log(`[${icon}] ${r.industryId} (${r.label}) — ${r.verdict} · ${r.durationMs}ms`)
    for (const c of r.checks) {
      const mark = c.status === "pass" ? "  +" : c.status === "warn" ? "  ~" : "  x"
      console.log(`${mark} ${c.label}: ${c.detail ?? c.status}`)
    }
    if (r.autoSubscribe.analyst.length) {
      console.log(`  → analista: ${r.autoSubscribe.analyst.join(", ")}`)
    }
    if (r.autoSubscribe.blocked.length) {
      console.log(`  → blocked: ${r.autoSubscribe.blocked.join(", ")}`)
    }
    if (r.error) console.log(`  ERROR: ${r.error}`)
    console.log("")
  }

  console.log(summary)

  if (withGemini || reports.some((r) => r.verdict !== "auto")) {
    console.log("\n--- Auditoría (Gemini o local) ---")
    const audit = await auditDemosWithGemini(reports, { force: withGemini })
    console.log(`provider=${audit.provider}${audit.model ? ` model=${audit.model}` : ""} usedAi=${audit.usedAi}`)
    console.log(audit.resumen)
    for (const a of audit.acciones) console.log(` • ${a}`)
    for (const p of audit.priorizacion) {
      console.log(` [${p.prioridad}] ${p.industryId}: ${p.motivo}`)
    }
  }

  const failed = reports.filter((r) => r.verdict === "failed").length
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
