import { describe, expect, it } from "vitest"
import {
  buildMetaOnCreate,
  estadoDesdeVencimiento,
  extractMetaBlock,
  inferMetaFromLegacy,
  isCobrarHoy,
  serializeObservaciones,
} from "@/lib/prestamos/prestamos-meta"
import { mensajeReciboCobro, mensajeRecordatorio, waMeUrl } from "@/lib/prestamos/prestamos-messages"

describe("prestamos-meta", () => {
  it("serializa y parsea bloque PRESTAMO", () => {
    const meta = buildMetaOnCreate({
      capital: 100000,
      interesPct: 30,
      fechaVencimiento: "2026-09-01",
    })
    const obs = serializeObservaciones(meta, "nota libre")
    const { meta: parsed, notas } = extractMetaBlock(obs)
    expect(parsed?.capital).toBe(100000)
    expect(parsed?.interes).toBe(30000)
    expect(parsed?.totalOriginal).toBe(130000)
    expect(parsed?.fechaVencimiento).toBe("2026-09-01")
    expect(notas).toBe("nota libre")
  })

  it("infiere capital e interés desde texto seed viejo", () => {
    const meta = inferMetaFromLegacy({
      saldo: 65000,
      observaciones: "Capital $50.000 + Interés $15.000 (30%)",
      fechaAlta: new Date("2026-08-01"),
    })
    expect(meta.capital).toBe(50000)
    expect(meta.interes).toBe(15000)
    expect(meta.interesPct).toBe(30)
  })

  it("estado vencido / vence hoy", () => {
    const hoy = new Date("2026-08-04T12:00:00.000Z")
    expect(estadoDesdeVencimiento(100, "2026-08-01", hoy)).toBe("Vencido")
    expect(estadoDesdeVencimiento(100, "2026-08-04", hoy)).toBe("Vence hoy")
    expect(estadoDesdeVencimiento(100, "2026-09-01", hoy)).toBe("Al día")
    expect(estadoDesdeVencimiento(0, "2026-08-01", hoy)).toBe("Saldado")
  })

  it("cobrar hoy incluye vencidos y vence hoy", () => {
    const hoy = new Date("2026-08-04T12:00:00.000Z")
    expect(isCobrarHoy(100, "2026-08-01", hoy)).toBe(true)
    expect(isCobrarHoy(100, "2026-08-04", hoy)).toBe(true)
    expect(isCobrarHoy(100, "2026-09-01", hoy)).toBe(false)
    expect(isCobrarHoy(0, "2026-08-01", hoy)).toBe(false)
  })
})

describe("prestamos-messages", () => {
  it("arma recordatorio con nombre de la empresa del tenant", () => {
    const msg = mensajeRecordatorio({
      cliente: "Aldo",
      saldo: 393000,
      empresaNombre: "Lázaro Préstamos",
      fechaVencimiento: "2026-09-01",
    })
    expect(msg).toContain("Aldo")
    expect(msg).toContain("Lázaro Préstamos")
    expect(msg).not.toContain("Claver")
  })

  it("recibo post-cobro con saldo restante", () => {
    const msg = mensajeReciboCobro({
      cliente: "Madera",
      monto: 20000,
      saldoRestante: 45000,
      empresaNombre: "Lázaro Préstamos",
      medio: "efectivo",
    })
    expect(msg).toContain("Madera")
    expect(msg).toContain("Lázaro")
  })

  it("wa.me con teléfono AR", () => {
    expect(waMeUrl("1123456789", "hola")).toContain("wa.me/541123456789")
    expect(waMeUrl(undefined, "hola")).toContain("wa.me/?text=")
  })
})
