/**
 * RBAC — roles y permisos por módulo
 */
import { describe, it, expect } from "vitest"
import { ROLES_SISTEMA, getRolesSugeridos, tienePermiso, getLimitesRol } from "@/lib/auth/roles"

describe("ROLES_SISTEMA", () => {
  it("define 9 roles preconfigurados", () => {
    expect(ROLES_SISTEMA).toHaveLength(9)
    const codigos = ROLES_SISTEMA.map((r) => r.codigo)
    expect(codigos).toContain("cajero")
    expect(codigos).toContain("contador")
    expect(codigos).toContain("vendedor_ruta")
  })
})

describe("tienePermiso", () => {
  it("cajero puede abrir caja pero no ver sueldos", () => {
    expect(tienePermiso("cajero", "caja", "abrir_caja")).toBe(true)
    expect(tienePermiso("cajero", "rrhh", "ver_sueldos")).toBe(false)
  })

  it("contador puede exportar impuestos pero no crear ventas", () => {
    expect(tienePermiso("contador", "impuestos", "exportar")).toBe(true)
    expect(tienePermiso("contador", "ventas", "crear")).toBe(false)
  })

  it("deposito no ve costos ni caja", () => {
    expect(tienePermiso("deposito", "stock", "transferir_stock")).toBe(true)
    expect(tienePermiso("deposito", "caja", "ver")).toBe(false)
  })
})

describe("getRolesSugeridos", () => {
  it("sugiere mozo para gastronomía", () => {
    const roles = getRolesSugeridos("bar_restaurant").map((r) => r.codigo)
    expect(roles).toContain("mozo")
  })

  it("sugiere vendedor_ruta para distribuidora", () => {
    const roles = getRolesSugeridos("distribuidora").map((r) => r.codigo)
    expect(roles).toContain("vendedor_ruta")
  })
})

describe("getLimitesRol", () => {
  it("vendedor_ruta tiene tope de descuento", () => {
    const limites = getLimitesRol("vendedor_ruta", "ventas")
    expect(limites?.descuentoMaxPct).toBe(15)
  })
})