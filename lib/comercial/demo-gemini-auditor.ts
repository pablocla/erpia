/**
 * Capa Gemini (opcional) sobre el validador determinístico de demos.
 * Si no hay API key, devuelve resumen local sin fallar.
 */

import { aiService } from "@/lib/ai/ai-service"
import type { DemoHealthReport } from "@/lib/comercial/demo-health-validator"

export interface GeminiDemoAudit {
  provider: string
  model?: string
  /** Resumen corto para analista Claver */
  resumen: string
  /** Acciones concretas: system vs analista vs cliente */
  acciones: string[]
  priorizacion: Array<{ industryId: string; prioridad: "P0" | "P1" | "P2"; motivo: string }>
  raw?: string
  usedAi: boolean
}

function localSummary(reports: DemoHealthReport[]): GeminiDemoAudit {
  const failed = reports.filter((r) => r.verdict === "failed")
  const needs = reports.filter((r) => r.verdict === "needs_analyst")
  const auto = reports.filter((r) => r.verdict === "auto")

  const acciones: string[] = []
  if (auto.length) {
    acciones.push(
      `${auto.length} demo(s) listas para calle sin intervención: ${auto.map((r) => r.industryId).join(", ")}`,
    )
  }
  for (const r of needs) {
    const analystSkus = r.autoSubscribe.analyst.concat(r.autoSubscribe.blocked)
    acciones.push(
      `${r.industryId}: revisar warnings; SKUs manuales: ${analystSkus.join(", ") || "ninguno"}`,
    )
  }
  for (const r of failed) {
    const fails = r.checks.filter((c) => c.status === "fail").map((c) => c.label)
    acciones.push(`P0 ${r.industryId}: falló ${fails.join(", ") || r.error || "provision"}`)
  }

  const priorizacion = [
    ...failed.map((r) => ({
      industryId: r.industryId,
      prioridad: "P0" as const,
      motivo: r.error ?? r.checks.find((c) => c.status === "fail")?.detail ?? "checks fail",
    })),
    ...needs.map((r) => ({
      industryId: r.industryId,
      prioridad: "P1" as const,
      motivo: r.checks.find((c) => c.status === "warn")?.detail ?? "needs_analyst",
    })),
  ]

  return {
    provider: "local",
    usedAi: false,
    resumen: `${auto.length} automáticas · ${needs.length} con analista · ${failed.length} rotas. Productos ancla/trial se auto-suscriben; pago va por MP; planned/setup van a analista.`,
    acciones,
    priorizacion,
  }
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Pide a Gemini un plan de intervención (solo cuando hay fallos o se fuerza).
 */
export async function auditDemosWithGemini(
  reports: DemoHealthReport[],
  opts?: { force?: boolean },
): Promise<GeminiDemoAudit> {
  const hasProblems = reports.some((r) => r.verdict !== "auto")
  if (!hasProblems && !opts?.force) {
    return localSummary(reports)
  }

  const status = await aiService.isAvailable()
  if (!status.available || status.provider === "none") {
    return localSummary(reports)
  }

  const compact = reports.map((r) => ({
    industryId: r.industryId,
    label: r.label,
    verdict: r.verdict,
    goldenPath: r.goldenPath,
    skusActivados: r.skusActivados,
    skusEsperados: r.skusEsperados,
    autoSubscribe: r.autoSubscribe,
    fails: r.checks.filter((c) => c.status === "fail"),
    warns: r.checks.filter((c) => c.status === "warn"),
    error: r.error,
  }))

  const system = `Sos QA Lead + analista Claver Cloud (Argentina).
Respondé SOLO JSON válido con esta forma:
{
  "resumen": "string corto en español",
  "acciones": ["string", "..."],
  "priorizacion": [{"industryId":"...", "prioridad":"P0"|"P1"|"P2", "motivo":"..."}]
}
Reglas de producto:
- Anclas gratis y trials de demo se auto-activan (system).
- Pagos van por Mercado Pago (cliente), sin analista.
- Setup, hardware, AFIP prod y SKUs planned → analista.
No inventes bugs que no estén en los checks.`

  try {
    const res = await aiService.chat(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: `Validación de demos Claver:\n${JSON.stringify(compact, null, 2)}`,
        },
      ],
      "batch",
    )

    if (!res.content) {
      return { ...localSummary(reports), provider: res.provider, model: res.model }
    }

    const parsed = extractJsonObject(res.content)
    if (!parsed) {
      return {
        ...localSummary(reports),
        provider: res.provider,
        model: res.model,
        raw: res.content,
        usedAi: true,
        resumen: res.content.slice(0, 500),
      }
    }

    const acciones = Array.isArray(parsed.acciones)
      ? parsed.acciones.map(String)
      : localSummary(reports).acciones
    const priorizacion = Array.isArray(parsed.priorizacion)
      ? (parsed.priorizacion as GeminiDemoAudit["priorizacion"])
      : localSummary(reports).priorizacion

    return {
      provider: res.provider,
      model: res.model,
      usedAi: true,
      resumen: String(parsed.resumen ?? ""),
      acciones,
      priorizacion,
      raw: res.content,
    }
  } catch (e) {
    const local = localSummary(reports)
    local.acciones.push(
      `Gemini no disponible: ${e instanceof Error ? e.message : "error"} — usando resumen local`,
    )
    return local
  }
}
