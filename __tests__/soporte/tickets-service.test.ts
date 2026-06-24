import { describe, it, expect } from "vitest"
import {
  buildTicketWhere,
  computeTicketMetricas,
  estaVencidoSla,
  horasAbierto,
} from "@/lib/soporte/tickets-service"

describe("tickets-service", () => {
  it("builds where clause with empresa and text search", () => {
    const where = buildTicketWhere({
      empresaId: 3,
      estado: "abierto",
      q: "afip",
    })

    expect(where).toMatchObject({
      empresaId: 3,
      estado: "abierto",
      OR: expect.any(Array),
    })
  })

  it("computes cross-tenant metrics", () => {
    const now = new Date()
    const old = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const metricas = computeTicketMetricas([
      {
        estado: "abierto",
        prioridad: "critica",
        modulo: "afip",
        createdAt: old,
        resolvedAt: null,
        empresaId: 1,
      },
      {
        estado: "cerrado",
        prioridad: "media",
        modulo: "ventas",
        createdAt: old,
        resolvedAt: now,
        empresaId: 2,
      },
    ])

    expect(metricas.resumen.total).toBe(2)
    expect(metricas.resumen.abiertos).toBe(1)
    expect(metricas.resumen.vencidosSla).toBe(1)
    expect(metricas.empresas).toHaveLength(2)
    expect(metricas.modulos).toHaveLength(2)
  })

  it("detects SLA breach for open tickets", () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 60 * 1000)
    expect(estaVencidoSla("abierto", "alta", createdAt)).toBe(true)
    expect(estaVencidoSla("cerrado", "alta", createdAt)).toBe(false)
  })

  it("calculates hours open", () => {
    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(horasAbierto(createdAt)).toBeGreaterThanOrEqual(1.9)
  })
})