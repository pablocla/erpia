import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { outboxService } from "@/lib/events/outbox-service"
import { eventBus } from "@/lib/events/event-bus"

beforeEach(() => {
  vi.clearAllMocks()
  outboxService.limpiarParaTests()
  mockPrismaClient.handlerLog.create.mockResolvedValue({ id: 1 })
})

describe("OutboxService (Transactional Outbox Pattern)", () => {
  it("debe registrar un evento como PENDIENTE y asegurar idempotencia por clave", async () => {
    const ev1 = await outboxService.registrarEvento({
      empresaId: 1,
      tipoEvento: "FACTURA_EMITIDA",
      payload: { facturaId: 101, total: 15000 },
      idempotencyKey: "factura:1:101",
    })

    expect(ev1.estado).toBe("PENDIENTE")
    expect(ev1.intentos).toBe(0)

    // Reintento con misma clave de idempotencia
    const ev2 = await outboxService.registrarEvento({
      empresaId: 1,
      tipoEvento: "FACTURA_EMITIDA",
      payload: { facturaId: 101, total: 15000 },
      idempotencyKey: "factura:1:101",
    })

    // Debe retornar exactamente la misma instancia y no duplicar
    expect(ev2.id).toBe(ev1.id)
  })

  it("debe procesar un evento exitosamente y marcarlo como COMPLETADO", async () => {
    const emitSpy = vi.spyOn(eventBus, "emit").mockResolvedValue(undefined as any)

    const ev = await outboxService.registrarEvento({
      empresaId: 1,
      tipoEvento: "COMPRA_REGISTRADA",
      payload: { compraId: 202, total: 50000 },
    })

    const resultado = await outboxService.procesarEvento(ev.id)

    expect(resultado).toBe(true)
    expect(emitSpy).toHaveBeenCalled()

    const consultado = outboxService.obtenerEvento(ev.id)
    expect(consultado?.estado).toBe("COMPLETADO")
    expect(consultado?.procesadoAt).toBeInstanceOf(Date)
    expect(consultado?.intentos).toBe(1)
  })

  it("debe incrementar intentos y programar reintento con backoff si el handler falla", async () => {
    vi.spyOn(eventBus, "emit").mockRejectedValue(new Error("Error de conexión con servicio"))

    const ev = await outboxService.registrarEvento({
      empresaId: 1,
      tipoEvento: "STOCK_ACTUALIZADO",
      payload: { productoId: 5, cantidadNueva: 20 },
      maxIntentos: 3,
    })

    const resultado = await outboxService.procesarEvento(ev.id)

    expect(resultado).toBe(false)

    const consultado = outboxService.obtenerEvento(ev.id)
    expect(consultado?.estado).toBe("PENDIENTE")
    expect(consultado?.intentos).toBe(1)
    expect(consultado?.ultimoError).toContain("Error de conexión con servicio")
    expect(consultado?.siguienteIntento.getTime()).toBeGreaterThan(Date.now())
  })

  it("debe marcar como FALLIDO cuando se superan los intentos máximos", async () => {
    vi.spyOn(eventBus, "emit").mockRejectedValue(new Error("Fallo irrecuperable"))

    const ev = await outboxService.registrarEvento({
      empresaId: 1,
      tipoEvento: "NC_EMITIDA",
      payload: { notaCreditoId: 8 },
      maxIntentos: 1,
    })

    await outboxService.procesarEvento(ev.id)

    const consultado = outboxService.obtenerEvento(ev.id)
    expect(consultado?.estado).toBe("FALLIDO")
    expect(consultado?.intentos).toBe(1)
  })
})
