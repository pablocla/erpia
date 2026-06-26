import { describe, it, expect } from "vitest"
import { buildAfipQrUrl, codigoCondicionIvaAfip } from "@/lib/fiscal/qr-fiscal"

describe("qr-fiscal", () => {
  it("genera URL AFIP con base64url", () => {
    const url = buildAfipQrUrl({
      cuitEmisor: "30123456789",
      tipoCbte: 6,
      puntoVenta: 1,
      numero: 100,
      codAut: "12345678901234",
      vencimientoAuth: new Date("2026-06-30"),
      importe: 1210.5,
      tipoCodAut: "E",
    })
    expect(url.startsWith("https://www.afip.gob.ar/fe/qr/?p=")).toBe(true)
  })

  it("mapea condición IVA receptor", () => {
    expect(codigoCondicionIvaAfip("Responsable Inscripto")).toBe(1)
    expect(codigoCondicionIvaAfip("Consumidor Final")).toBe(5)
    expect(codigoCondicionIvaAfip("Monotributista")).toBe(6)
  })
})