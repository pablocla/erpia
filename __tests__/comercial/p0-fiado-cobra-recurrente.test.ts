import { describe, expect, it } from "vitest"
import { CRON_JOBS, getJobsForTier } from "@/lib/scheduling/cron-registry"
import { OFERTA_FIADO_ANCLA } from "@/lib/comercial/ofertas-comerciales"
import { LITE_MENU_PATHS } from "@/lib/comercial/lite-sidebar"
import { HOME_COMBATE_SLUGS } from "@/lib/comercial/go-to-market-vitrine"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"

describe("P0 Fiado + Cobrá + recurrente", () => {
  it("cron facturacion-recurrente está en tier free", () => {
    const job = CRON_JOBS.find((j) => j.id === "facturacion-recurrente")
    expect(job).toBeTruthy()
    expect(job!.tier).toBe("free")
    expect(job!.schedule).toBeTruthy()
    expect(getJobsForTier("free").some((j) => j.id === "facturacion-recurrente")).toBe(true)
  })

  it("cron cobranzas-ia está en tier free (Cobrá operable)", () => {
    const job = CRON_JOBS.find((j) => j.id === "cobranzas-ia")
    expect(job).toBeTruthy()
    expect(job!.tier).toBe("free")
    expect(getJobsForTier("free").some((j) => j.id === "cobranzas-ia")).toBe(true)
  })

  it("ancla fiado incluye pos.fiado_barrio y monetiza core", () => {
    expect(OFERTA_FIADO_ANCLA.anclaGratis).toContain("pos.fiado_barrio")
    expect(OFERTA_FIADO_ANCLA.monetizar).toContain("core.claver")
    expect(OFERTA_FIADO_ANCLA.modoLiteEntrada).toBe("fiado")
  })

  it("modo lite fiado y cobranza incluyen cuentas a cobrar (cobro manual)", () => {
    expect(LITE_MENU_PATHS.fiado).toContain("/dashboard/cuentas-cobrar")
    expect(LITE_MENU_PATHS.cobranza).toContain("/dashboard/cuentas-cobrar")
    expect(LITE_MENU_PATHS.cobranza).toContain("/dashboard/fiado")
  })

  it("home combate resuelve activación fiado/cobra", () => {
    expect(HOME_COMBATE_SLUGS).toEqual(["fiado", "cobra", "turnos"])
    for (const slug of ["fiado", "cobra"] as const) {
      const intent = resolveActivarIntent(slug)
      expect(intent).toBeTruthy()
      expect(intent!.landingPath).toMatch(/^\/dashboard/)
    }
  })
})
