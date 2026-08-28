import { describe, expect, it } from "vitest"
import {
  OFERTA_FIADO_ANCLA,
  OFERTA_POS_ANCLA,
  resolveOferta,
  vigenciaParaSku,
  precioOfertaMonetizada,
} from "@/lib/comercial/ofertas-comerciales"
import { PRECIO_MINIMO_SUSCRIPCION_ARS } from "@/lib/comercial/precio-minimo"
import { ANCLA_FIADO_ALLOWLIST, isPathInAnclaFiadoAllowlist } from "@/lib/comercial/lite-sidebar"
import { getActiveProductShell } from "@/lib/comercial/product-shell"

describe("go-live ancla + shells", () => {
  it("fiado-ancla deja pos.fiado_barrio sin vencimiento", () => {
    const end = new Date("2030-01-01")
    expect(vigenciaParaSku(OFERTA_FIADO_ANCLA, "pos.fiado_barrio", end)).toBeNull()
    expect(vigenciaParaSku(OFERTA_FIADO_ANCLA, "core.claver", end)).toEqual(end)
  })

  it("resolveOferta fiado y pos tienen precio pack cobrable", () => {
    expect(resolveOferta("pos.fiado_barrio", "fiado").id).toBe("fiado-ancla")
    expect(precioOfertaMonetizada(OFERTA_FIADO_ANCLA)).toBeGreaterThanOrEqual(PRECIO_MINIMO_SUSCRIPCION_ARS)
    expect(precioOfertaMonetizada(OFERTA_POS_ANCLA)).toBeGreaterThanOrEqual(PRECIO_MINIMO_SUSCRIPCION_ARS)
  })

  it("allowlist ancla incluye config y home", () => {
    expect(ANCLA_FIADO_ALLOWLIST).toContain("/dashboard/configuracion")
    expect(isPathInAnclaFiadoAllowlist("/dashboard/fiado")).toBe(true)
    expect(isPathInAnclaFiadoAllowlist("/dashboard/configuracion")).toBe(true)
    expect(isPathInAnclaFiadoAllowlist("/dashboard/pos")).toBe(true)
    expect(isPathInAnclaFiadoAllowlist("/dashboard/caja")).toBe(true)
  })

  it("modoLite pos usa shell POS no tienda", () => {
    const shell = getActiveProductShell("pos", null)
    expect(shell?.slug).toBe("pos")
    expect(shell?.tabs.some((t) => t.href === "/dashboard/pos")).toBe(true)
  })

  it("modoLite fiado shell incluye libreta", () => {
    const shell = getActiveProductShell("fiado", null)
    expect(shell?.slug).toBe("fiado")
    expect(shell?.tabs.some((t) => t.href === "/dashboard/fiado")).toBe(true)
  })
})
