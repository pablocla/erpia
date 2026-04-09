/**
 * EventBus — Unit Tests
 *
 * Tests handler registration, dispatching, enable/disable via
 * ConfiguracionFuncional, error isolation, and logging.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

let EventBus: any
let eventBus: any

beforeEach(async () => {
  vi.clearAllMocks()

  // Reset module cache so we get a fresh singleton
  vi.resetModules()
  const mod = await import("@/lib/events/event-bus")
  eventBus = mod.eventBus

  // Default: no ConfiguracionFuncional rows → all handlers active
  mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
  mockPrismaClient.handlerLog = mockPrismaClient.handlerLog || {
    create: vi.fn().mockResolvedValue({}),
  }
})

describe("EventBus", () => {
  it("should execute registered handlers for matching events", async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    eventBus.on("FACTURA_EMITIDA", "test_handler_1", handler)

    await eventBus.emit({
      type: "FACTURA_EMITIDA",
      payload: { facturaId: 1 },
      timestamp: new Date(),
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: "FACTURA_EMITIDA", payload: { facturaId: 1 } }),
    )
  })

  it("should NOT execute handlers for different event types", async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    eventBus.on("COMPRA_REGISTRADA", "test_handler_2", handler)

    await eventBus.emit({
      type: "FACTURA_EMITIDA",
      payload: { facturaId: 1 },
      timestamp: new Date(),
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it("should skip handlers disabled in ConfiguracionFuncional", async () => {
    mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([
      { handler: "disabled_handler", activo: false },
    ])

    const handler = vi.fn().mockResolvedValue(undefined)
    eventBus.on("FACTURA_EMITIDA", "disabled_handler", handler)

    await eventBus.emit({
      type: "FACTURA_EMITIDA",
      payload: { facturaId: 1 },
      timestamp: new Date(),
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it("should isolate errors — one handler failure doesn't block others", async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error("boom"))
    const successHandler = vi.fn().mockResolvedValue(undefined)

    eventBus.on("FACTURA_EMITIDA", "failing_handler", failingHandler)
    eventBus.on("FACTURA_EMITIDA", "success_handler", successHandler)

    // Should NOT throw even though one handler fails
    await expect(
      eventBus.emit({
        type: "FACTURA_EMITIDA",
        payload: { facturaId: 1 },
        timestamp: new Date(),
      }),
    ).resolves.toBeUndefined()

    expect(failingHandler).toHaveBeenCalledTimes(1)
    expect(successHandler).toHaveBeenCalledTimes(1)
  })

  it("should remove handlers with off()", async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    eventBus.on("FACTURA_EMITIDA", "removable_handler", handler)
    eventBus.off("removable_handler")

    await eventBus.emit({
      type: "FACTURA_EMITIDA",
      payload: { facturaId: 1 },
      timestamp: new Date(),
    })

    expect(handler).not.toHaveBeenCalled()
  })
})
