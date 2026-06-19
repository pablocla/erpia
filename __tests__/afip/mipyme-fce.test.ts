import { describe, it, expect } from "vitest"
import {
  buildFceOpcionales,
  buildCbtesAsocFce,
  isFceTipoCbte,
  isFceNotaCreditoDebito,
  mapBaseTipoToFce,
  validateCbu,
  normalizeCbu,
} from "@/lib/afip/mipyme-fce"

describe("mipyme-fce", () => {
  it("detecta tipos FCE", () => {
    expect(isFceTipoCbte(201)).toBe(true)
    expect(isFceTipoCbte(206)).toBe(true)
    expect(isFceTipoCbte(1)).toBe(false)
  })

  it("mapea factura A a FCE A", () => {
    expect(mapBaseTipoToFce(1)).toBe(201)
    expect(mapBaseTipoToFce(6)).toBe(206)
    expect(mapBaseTipoToFce(99)).toBeNull()
  })

  it("valida CBU de 22 dígitos", () => {
    expect(validateCbu("0000003100010000000000")).toBe(true)
    expect(validateCbu("123")).toBe(false)
    expect(normalizeCbu("0000-0031-00010000000000")).toBe("0000003100010000000000")
  })

  it("arma opcionales AFIP 2101 y 2102", () => {
    const op = buildFceOpcionales("0000003100010000000000", "SCA")
    expect(op.Opcional).toHaveLength(2)
    expect(op.Opcional[0]).toEqual({ Id: 2101, Valor: "0000003100010000000000" })
    expect(op.Opcional[1]).toEqual({ Id: 2102, Valor: "SCA" })
  })

  it("rechaza CBU inválido en opcionales", () => {
    expect(() => buildFceOpcionales("abc")).toThrow(/CBU/)
  })

  it("identifica NC/ND FCE", () => {
    expect(isFceNotaCreditoDebito(203)).toBe(true)
    expect(isFceNotaCreditoDebito(201)).toBe(false)
  })

  it("arma comprobante asociado", () => {
    const asoc = buildCbtesAsocFce({
      Tipo: 201,
      PtoVta: 1,
      Nro: 100,
      Cuit: "20123456789",
      CbteFch: "20260619",
    })
    expect(asoc.CbteAsoc[0].Nro).toBe(100)
  })
})