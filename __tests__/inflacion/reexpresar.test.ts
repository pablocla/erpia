import { describe, it, expect } from "vitest"
import {
  reexpresarMonto,
  indexarPrecioCatalogo,
  valuarDeudaTenant,
  setTenantPolicy,
  puedePagarNominal,
} from "@/lib/inflacion"

describe("reexpresarMonto", () => {
  it("sube el monto cuando el IPC sube entre origen y valuación", () => {
    const r = reexpresarMonto({
      montoOriginal: 10_000,
      fechaOrigen: "2026-01-10",
      fechaValuacion: "2026-07-20",
      indiceCodigo: "IPC_NACIONAL",
    })
    expect(r.factor).toBeGreaterThan(1)
    expect(r.montoAjustado).toBeGreaterThan(r.montoOriginal)
    expect(r.perdidaPoderAdquisitivo).toBeGreaterThan(0)
  })

  it("respeta tope de variación", () => {
    const r = reexpresarMonto({
      montoOriginal: 10_000,
      fechaOrigen: "2025-01-15",
      fechaValuacion: "2026-07-20",
      topeVariacionPeriodo: 0.05,
    })
    expect(r.factor).toBeLessThanOrEqual(1.05 + 1e-9)
  })
})

describe("billing trigger", () => {
  it("indexarPrecioCatalogo devuelve estructura", () => {
    const r = indexarPrecioCatalogo(24_900, "2026-01")
    expect(r.precioBaseArs).toBe(24_900)
    expect(r.precioIndexadoArs).toBeGreaterThanOrEqual(10_000)
    expect(r.policyActiva).toBe(true)
  })
})

describe("tenant fiado", () => {
  it("modo informativo mantiene cobrable = nominal", () => {
    setTenantPolicy(1, "fiado", { activo: true, soloInformativo: true })
    const v = valuarDeudaTenant({
      empresaId: 1,
      subsystem: "fiado",
      montoOriginal: 10_000,
      fechaOrigen: "2026-01-05",
      fechaValuacion: new Date("2026-07-20"),
    })
    expect(v.montoCobrableHoy).toBe(10_000)
    expect(v.reexpresion.montoAjustado).toBeGreaterThan(10_000)
    expect(v.soloInformativo).toBe(true)
  })

  it("modo cobro indexado fuera de gracia usa ajustado", () => {
    setTenantPolicy(2, "fiado", {
      activo: true,
      soloInformativo: false,
      diasGraciaNominal: 5,
      diaPublicacion: 5,
    })
    const v = valuarDeudaTenant({
      empresaId: 2,
      subsystem: "fiado",
      montoOriginal: 10_000,
      fechaOrigen: "2026-01-05",
      fechaValuacion: new Date("2026-07-20"),
    })
    expect(v.puedePagarNominalHoy).toBe(false)
    expect(v.montoCobrableHoy).toBe(v.reexpresion.montoAjustado)
  })
})

describe("puedePagarNominal", () => {
  it("true a principios de mes", () => {
    expect(
      puedePagarNominal({
        fechaValuacion: new Date(2026, 6, 3),
        diasGraciaNominal: 15,
        diaPublicacion: 15,
      }),
    ).toBe(true)
  })
})
