import { describe, expect, it } from "vitest"
import { activarRegisterHref, resolveActivarIntent } from "@/lib/comercial/activar-intent"

describe("activar-intent", () => {
  it("resuelve sub-saas por slug", () => {
    const intent = resolveActivarIntent("fiado")
    expect(intent?.marca).toBe("Claver Fiado")
    expect(intent?.engancheId).toBe("pos.fiado_barrio")
    expect(intent?.landingPath).toBe("/dashboard/fiado")
    expect(intent?.modoLite).toBe("fiado")
  })

  it("resuelve sub-saas por sku", () => {
    const intent = resolveActivarIntent("intang.cobranzas_wa")
    expect(intent?.marca).toBe("Claver Cobrá")
    expect(intent?.modoLite).toBe("cobranza")
  })

  it("resuelve pack calle", () => {
    const intent = resolveActivarIntent("pool-almacen-barrio")
    expect(intent?.engancheId).toBe("pool-almacen-barrio")
    expect(intent?.modoLite).toBe("completo")
  })

  it("resuelve Claver Propiedad por slug", () => {
    const intent = resolveActivarIntent("propiedad")
    expect(intent?.marca).toBe("Claver Propiedad")
    expect(intent?.engancheId).toBe("pool-propiedad")
    expect(intent?.modoLite).toBe("niche")
    expect(intent?.landingPath).toBe("/dashboard/nicho/consorcios")
  })

  it("resuelve packs de servicios profesionales", () => {
    const mono = resolveActivarIntent("monotributo")
    expect(mono?.engancheId).toBe("pool-monotributo")
    expect(mono?.modoLite).toBe("servicios")

    const serv = resolveActivarIntent("servicios")
    expect(serv?.engancheId).toBe("pool-servicios-pro")
    expect(serv?.landingPath).toBe("/dashboard/agenda")

    const obra = resolveActivarIntent("obra")
    expect(obra?.engancheId).toBe("pool-obra")
    expect(obra?.modoLite).toBe("niche")
    expect(obra?.landingPath).toBe("/dashboard/nicho/obras")
  })

  it("genera href de registro con activar", () => {
    expect(activarRegisterHref("fiado")).toBe("/login/register?activar=fiado&trial=14")
    expect(activarRegisterHref(null)).toBe("/login/register?trial=14")
  })
})