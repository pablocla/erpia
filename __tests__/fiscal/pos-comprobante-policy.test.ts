import { describe, expect, it } from "vitest"
import {
  resolvePosComprobante,
  resolverTipoDefault,
  tiposPermitidosSegunModo,
} from "@/lib/fiscal/pos-comprobante-policy"
import { buildEscPosEtiqueta } from "@/lib/printer/label-builder"

describe("pos-comprobante-policy", () => {
  it("modo AFIP default B/auto y permite ticket si config lo habilita", () => {
    const r = resolvePosComprobante({
      modoComprobante: "afip",
      tipoDefaultAfip: "auto",
      tipoSugeridoCliente: "B",
      permitirTicketSinAfip: true,
      afipDisponible: true,
      tipoManual: false,
    })
    expect(r.tipoEfectivo).toBe("B")
    expect(r.tiposPermitidos).toContain("B")
    expect(r.tiposPermitidos).toContain("ticket")
    expect(r.requiereAfip).toBe(true)
  })

  it("modo AFIP sin cert cae a ticket si está permitido", () => {
    const r = resolvePosComprobante({
      modoComprobante: "afip",
      tipoDefaultAfip: "B",
      permitirTicketSinAfip: true,
      afipDisponible: false,
      tipoManual: false,
    })
    expect(r.tipoEfectivo).toBe("ticket")
  })

  it("modo cajero respeta elección ticket", () => {
    const r = resolvePosComprobante({
      modoComprobante: "cajero",
      tipoDefaultAfip: "B",
      permitirTicketSinAfip: true,
      afipDisponible: true,
      tipoElegido: "ticket",
      tipoManual: true,
    })
    expect(r.tipoEfectivo).toBe("ticket")
    expect(r.selectorBloqueado).toBe(false)
  })

  it("modo ticket_solo fuerza ticket", () => {
    const r = resolvePosComprobante({
      modoComprobante: "ticket_solo",
      tipoDefaultAfip: "A",
      permitirTicketSinAfip: false,
      afipDisponible: true,
      tipoElegido: "A",
      tipoManual: true,
    })
    expect(r.tipoEfectivo).toBe("ticket")
    expect(r.selectorBloqueado).toBe(true)
  })

  it("offline siempre ticket", () => {
    const r = resolvePosComprobante({
      modoComprobante: "afip",
      tipoDefaultAfip: "A",
      permitirTicketSinAfip: false,
      afipDisponible: true,
      offline: true,
    })
    expect(r.tipoEfectivo).toBe("ticket")
  })

  it("tiposPermitidosSegunModo", () => {
    expect(tiposPermitidosSegunModo("ticket_solo", true, true)).toEqual(["ticket"])
    expect(tiposPermitidosSegunModo("afip", false, true)).toEqual(["A", "B", "C"])
    expect(resolverTipoDefault({
      modoComprobante: "afip",
      tipoDefaultAfip: "auto",
      tipoSugeridoCliente: "A",
    })).toBe("A")
  })
})

describe("label-builder", () => {
  it("genera buffer ESC/POS con precio", () => {
    const buf = buildEscPosEtiqueta({
      nombre: "Gaseosa 2L",
      codigoBarras: "7790001000001",
      precio: 2500,
      empresaNombre: "Kiosco Demo",
    })
    expect(buf.length).toBeGreaterThan(40)
    expect(buf.includes(0x1b)).toBe(true) // ESC
  })
})
