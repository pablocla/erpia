import { describe, it, expect } from "vitest"
import { DISPAROS_CONFIG, tieneDisparoHabilitado } from "@/lib/comercial/paywall-disparo"
import { reglaSkuParaRuta } from "@/lib/comercial/api-sku-entitlements"

describe("Paywall Disparo & Entitlements", () => {
  it("debe tener configurados los 6 disparos canónicos", () => {
    expect(DISPAROS_CONFIG.whatsapp_outbound).toBeDefined()
    expect(DISPAROS_CONFIG.sena_link_mp).toBeDefined()
    expect(DISPAROS_CONFIG.factura_afip).toBeDefined()
    expect(DISPAROS_CONFIG.segunda_caja).toBeDefined()
    expect(DISPAROS_CONFIG.tercer_usuario).toBeDefined()
    expect(DISPAROS_CONFIG.reportes_historicos).toBeDefined()
  })

  it("ARCA y WhatsApp se pactan (turno), no se venden como checkout ciego", () => {
    expect(DISPAROS_CONFIG.factura_afip.ctaModo).toBe("pactar-implementacion")
    expect(DISPAROS_CONFIG.whatsapp_outbound.ctaModo).toBe("pactar-implementacion")
    expect(DISPAROS_CONFIG.factura_afip.aclaracionGratis.toLowerCase()).toContain("ticket")
  })

  it("debe validar correctamente si un tenant tiene habilitado el disparo", () => {
    // Tenant ancla gratis (solo pos.fiado_barrio)
    const skusAncla = ["pos.fiado_barrio"]
    expect(tieneDisparoHabilitado("whatsapp_outbound", skusAncla)).toBe(false)
    expect(tieneDisparoHabilitado("factura_afip", skusAncla)).toBe(false)
    expect(tieneDisparoHabilitado("tercer_usuario", skusAncla)).toBe(false)

    // Tenant con Cobrá activo
    const skusCobra = ["pos.fiado_barrio", "intang.cobranzas_wa"]
    expect(tieneDisparoHabilitado("whatsapp_outbound", skusCobra)).toBe(true)
    expect(tieneDisparoHabilitado("factura_afip", skusCobra)).toBe(false)

    // Tenant con plan core full
    const skusCore = ["core.claver"]
    expect(tieneDisparoHabilitado("whatsapp_outbound", skusCore)).toBe(true)
    expect(tieneDisparoHabilitado("factura_afip", skusCore)).toBe(true)
    expect(tieneDisparoHabilitado("tercer_usuario", skusCore)).toBe(true)
  })

  it("debe proteger rutas de escritura exigiendo el SKU adecuado", () => {
    const afipRule = reglaSkuParaRuta("/api/afip/facturar", "POST")
    expect(afipRule).not.toBeNull()
    expect(afipRule?.skus).toContain("fiscal.cert_afip")

    const posRule = reglaSkuParaRuta("/api/pos/venta", "POST")
    expect(posRule).not.toBeNull()
    expect(posRule?.skus).toContain("pos.fiado_barrio")
  })
})
