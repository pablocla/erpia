import { describe, it, expect } from "vitest"
import {
  mapCondicionIvaReceptor,
  validarTipoCbteVsCondicion,
  CONDICION_IVA_RECEPTOR_AFIP,
} from "@/lib/afip/condicion-iva-afip"
import {
  validarImportesFe,
  validarMoneda,
  validarDocReceptor,
  validarFechaCbte,
} from "@/lib/afip/payload-validators"
import { resolveFceFchVtoPago, isFceFactura } from "@/lib/afip/mipyme-fce"
import { translateAfipError, formatAfipObservaciones } from "@/lib/afip/afip-error-translator"

describe("condicion-iva-afip", () => {
  it("mapea labels comunes", () => {
    expect(mapCondicionIvaReceptor("Responsable Inscripto")).toBe(
      CONDICION_IVA_RECEPTOR_AFIP.RI,
    )
    expect(mapCondicionIvaReceptor("Monotributista")).toBe(
      CONDICION_IVA_RECEPTOR_AFIP.MONOTRIBUTO,
    )
    expect(mapCondicionIvaReceptor("Consumidor Final")).toBe(
      CONDICION_IVA_RECEPTOR_AFIP.CF,
    )
    expect(mapCondicionIvaReceptor("Cliente del Exterior")).toBe(
      CONDICION_IVA_RECEPTOR_AFIP.CLIENTE_EXTERIOR,
    )
  })

  it("valida factura A solo a RI", () => {
    expect(
      validarTipoCbteVsCondicion(1, CONDICION_IVA_RECEPTOR_AFIP.RI),
    ).toBeNull()
    expect(
      validarTipoCbteVsCondicion(1, CONDICION_IVA_RECEPTOR_AFIP.CF),
    ).toMatch(/Responsable Inscripto/)
  })
})

describe("payload-validators", () => {
  it("detecta importes que no cierran", () => {
    const r = validarImportesFe({
      impNeto: 100,
      impTotConc: 0,
      impOpEx: 0,
      impIva: 21,
      impTrib: 0,
      impTotal: 999,
    })
    expect(r.ok).toBe(false)
  })

  it("acepta importes correctos", () => {
    const r = validarImportesFe({
      impNeto: 100,
      impTotConc: 0,
      impOpEx: 0,
      impIva: 21,
      impTrib: 5,
      impTotal: 126,
      ivaItems: [{ BaseImp: 100, Importe: 21 }],
    })
    expect(r.ok).toBe(true)
  })

  it("exige cotización si no es PES", () => {
    expect(validarMoneda("DOL", 0).ok).toBe(false)
    expect(validarMoneda("DOL", 1200).ok).toBe(true)
  })

  it("exige CUIT en factura A", () => {
    expect(validarDocReceptor(96, "30111222", 1).ok).toBe(false)
    expect(validarDocReceptor(80, "20123456789", 1).ok).toBe(true)
  })

  it("valida fecha YYYYMMDD", () => {
    const hoy = new Date()
    const f = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`
    expect(validarFechaCbte(f).ok).toBe(true)
    expect(validarFechaCbte("2020").ok).toBe(false)
  })
})

describe("fce helpers", () => {
  it("isFceFactura", () => {
    expect(isFceFactura(201)).toBe(true)
    expect(isFceFactura(203)).toBe(false)
  })

  it("resolveFceFchVtoPago default +30d", () => {
    const emision = new Date(2026, 0, 1)
    const f = resolveFceFchVtoPago(emision)
    expect(f).toBe("20260131")
  })
})

describe("afip-error-translator", () => {
  it("traduce códigos conocidos", () => {
    const msg = translateAfipError('ErrCode: 10242, ErrMsg: condicion')
    expect(msg).toMatch(/10242|CondicionIVAReceptor/i)
  })

  it("formatea observaciones", () => {
    const s = formatAfipObservaciones({
      Obs: [{ Code: 10016, Msg: "doc" }],
    })
    expect(s).toMatch(/10016/)
  })
})
