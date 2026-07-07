import { describe, expect, it } from "vitest"
import {
  OFERTA_FIADO_ANCLA,
  resolveOferta,
  vigenciaParaSku,
  skusAdicionalesOferta,
  precioOfertaMonetizada,
} from "@/lib/comercial/ofertas-comerciales"

describe("ofertas-comerciales", () => {
  it("resuelve fiado-ancla para pos.fiado_barrio", () => {
    const oferta = resolveOferta("pos.fiado_barrio", "fiado")
    expect(oferta.id).toBe("fiado-ancla")
    expect(oferta.anclaGratis).toContain("pos.fiado_barrio")
    expect(oferta.monetizar).toContain("core.claver")
  })

  it("ancla gratis sin vigencia de trial", () => {
    const trialEnd = new Date("2030-01-01")
    expect(vigenciaParaSku(OFERTA_FIADO_ANCLA, "pos.fiado_barrio", trialEnd)).toBeNull()
    expect(vigenciaParaSku(OFERTA_FIADO_ANCLA, "core.claver", trialEnd)?.toISOString()).toBe(
      trialEnd.toISOString(),
    )
  })

  it("sugiere SKUs monetizados adicionales al enganche", () => {
    const extra = skusAdicionalesOferta(OFERTA_FIADO_ANCLA, ["pos.fiado_barrio"])
    expect(extra).toEqual(["core.claver"])
  })

  it("calcula precio del pack monetizado", () => {
    expect(precioOfertaMonetizada(OFERTA_FIADO_ANCLA)).toBe(12900)
  })

  it("packs marketplace usan trial clásico", () => {
    const oferta = resolveOferta("pool-almacen-barrio", "completo")
    expect(oferta.id).toBe("clasico-trial")
  })
})