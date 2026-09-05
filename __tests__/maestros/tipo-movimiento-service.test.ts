import { describe, it, expect } from "vitest"
import { tipoMovimientoService } from "@/lib/maestros/tipo-movimiento-service"

describe("TipoMovimientoService", () => {
  it("debe retornar la definición correcta para VENTA_CONTADO", () => {
    const def = tipoMovimientoService.getTipoMovimiento("VENTA_CONTADO")
    expect(def.signoStock).toBe(-1)
    expect(def.signoCaja).toBe(1)
    expect(def.afectaContabilidad).toBe(true)
    expect(def.requiereAprobacion).toBe(false)
  })

  it("debe retornar la definición correcta para VENTA_CUENTA_CORRIENTE", () => {
    const def = tipoMovimientoService.getTipoMovimiento("VENTA_CUENTA_CORRIENTE")
    expect(def.signoStock).toBe(-1)
    expect(def.signoCaja).toBe(0) // No ingresa dinero a caja
    expect(def.afectaContabilidad).toBe(true)
  })

  it("debe bloquear operación si requiere aprobación y no es supervisor", () => {
    const res = tipoMovimientoService.validarOperacion("AJUSTE_SOBRANTE_STOCK", {
      cantidad: 10,
      usuarioEsSupervisor: false,
    })
    expect(res.valido).toBe(false)
    expect(res.motivo).toContain("requiere autorización")
  })

  it("debe permitir operación si el usuario es supervisor", () => {
    const res = tipoMovimientoService.validarOperacion("AJUSTE_SOBRANTE_STOCK", {
      cantidad: 10,
      usuarioEsSupervisor: true,
    })
    expect(res.valido).toBe(true)
  })

  it("debe bloquear venta si el stock disponible es insuficiente y no permite sin stock", () => {
    const res = tipoMovimientoService.validarOperacion("VENTA_CONTADO", {
      cantidad: 15,
      stockDisponible: 10,
    })
    expect(res.valido).toBe(false)
    expect(res.motivo).toContain("Stock insuficiente")
  })

  it("debe permitir venta si el stock disponible es suficiente", () => {
    const res = tipoMovimientoService.validarOperacion("VENTA_CONTADO", {
      cantidad: 5,
      stockDisponible: 10,
    })
    expect(res.valido).toBe(true)
  })
})
