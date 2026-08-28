import { describe, expect, it } from "vitest"
import { AFILIADO_RATES, dentroDeClawback, corteRetiroCash } from "@/lib/partners/affiliate-config"
import { simularComisionPartner } from "@/lib/partners/commission-simulator"
import { buildReferralStreetUrl } from "@/lib/partners/program-copy"
import { landingFRegisterHref, landingFServiciosRegisterHref } from "@/lib/comercial/landing-f"

describe("simularComisionPartner", () => {
  it("50 referidos × 10% upsell × $20.000 → 5 pagos; mes 1 bounty 100%; mes 6 = 30% × 40% retención", () => {
    const s = simularComisionPartner({
      referidos: 50,
      upsellPct: 10,
      extraArs: 20_000,
      n1Rate: AFILIADO_RATES.sellerNivel1,
      retencionMes6: 0.4,
    })
    expect(s.pagadores).toBe(5)
    expect(s.mes1Bounty).toBe(100_000)
    expect(s.mensualRecurrente).toBe(30_000)
    expect(s.mes6).toBe(12_000)
  })

  it("upsell 0 → comisión 0 (ancla no paga)", () => {
    const s = simularComisionPartner({
      referidos: 80,
      upsellPct: 0,
      extraArs: 20_000,
      n1Rate: 0.3,
    })
    expect(s.pagadores).toBe(0)
    expect(s.mes1Bounty).toBe(0)
  })
})

describe("clawback y retiro", () => {
  it("30 días de clawback", () => {
    expect(AFILIADO_RATES.clawbackDias).toBe(30)
    const pago = new Date("2026-08-01T12:00:00Z")
    expect(dentroDeClawback(pago, new Date("2026-08-20T12:00:00Z"))).toBe(true)
    expect(dentroDeClawback(pago, new Date("2026-09-05T12:00:00Z"))).toBe(false)
  })

  it("corte de cash a 60 días", () => {
    expect(AFILIADO_RATES.retiroCashDesdeDias).toBe(60)
    const now = new Date("2026-08-26T00:00:00Z")
    const corte = corteRetiroCash(now)
    expect(corte.toISOString().slice(0, 10)).toBe("2026-06-27")
  })
})

describe("links de calle", () => {
  it("street URL va a /f?ref=", () => {
    expect(buildReferralStreetUrl("juan perez", { baseUrl: "https://claver.com.ar" })).toBe(
      "https://claver.com.ar/f?ref=JUAN_PEREZ",
    )
  })

  it("/f preserva ref en el alta", () => {
    expect(landingFRegisterHref("ANA")).toBe(
      "/login/register?activar=pos.fiado_barrio&ref=ANA",
    )
    expect(landingFRegisterHref()).toBe("/login/register?activar=pos.fiado_barrio")
  })

  it("/f/servicios preserva ref y activa oficios", () => {
    expect(landingFServiciosRegisterHref("ANA")).toBe(
      "/login/register?activar=niche.oficios&ref=ANA",
    )
  })
})
