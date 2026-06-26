import { describe, it, expect } from "vitest"
import { generarDteXml, validarRutChile, CL_DTE_TIPOS } from "@/lib/tes/fiscal/cl-sii-dte"
import { generarCfdi40Xml, MX_USO_CFDI } from "@/lib/tes/fiscal/mx-cfdi40"

describe("fiscal CL SII DTE", () => {
  it("valida RUT chileno", () => {
    expect(validarRutChile("12.345.678-5")).toBe(true)
    expect(validarRutChile("12.345.678-0")).toBe(false)
  })

  it("genera XML DTE tipo 33", () => {
    const xml = generarDteXml({
      tipoDte: CL_DTE_TIPOS.FACTURA_ELECTRONICA,
      folio: 100,
      fechaEmision: new Date("2026-06-25"),
      rutEmisor: "76123456-K",
      rutReceptor: "12345678-5",
      razonSocialReceptor: "Cliente SPA",
      lineas: [{ nombre: "Producto", cantidad: 1, precioUnitario: 1000, montoItem: 1000 }],
      montoNeto: 1000,
      montoIva: 190,
      montoTotal: 1190,
    })
    expect(xml).toContain("<TipoDTE>33</TipoDTE>")
    expect(xml).toContain("<MntTotal>1190</MntTotal>")
  })
})

describe("fiscal MX CFDI 4.0", () => {
  it("genera XML CFDI con IVA 16%", () => {
    const xml = generarCfdi40Xml({
      serie: "A",
      folio: "100",
      fecha: new Date("2026-06-25T12:00:00"),
      formaPago: "03",
      metodoPago: "PUE",
      lugarExpedicion: "64000",
      emisorRfc: "AAA010101AAA",
      emisorNombre: "Emisor SA",
      emisorRegimen: "601",
      receptorRfc: "XAXX010101000",
      receptorNombre: "Público General",
      receptorUsoCfdi: MX_USO_CFDI.POR_DEFINIR,
      conceptos: [{
        claveProdServ: "01010101",
        cantidad: 1,
        claveUnidad: "H87",
        descripcion: "Producto",
        valorUnitario: 100,
        importe: 100,
        objetoImp: "02",
      }],
      subtotal: 100,
      total: 116,
      ivaTrasladado: 16,
    })
    expect(xml).toContain('Version="4.0"')
    expect(xml).toContain("TotalImpuestosTrasladados=\"16.00\"")
  })
})