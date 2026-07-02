import { describe, expect, it } from "vitest"
import { filterMenuItemsByModoLite } from "@/lib/comercial/lite-sidebar"

describe("onboarding-retail-lite-modes", () => {
  const menuMock = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/pos", label: "Punto de Venta" },
    { href: "/dashboard/fiado", label: "Libreta Fiado" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/configuracion", label: "Configuración" },
    { href: "/dashboard/cuentas-cobrar", label: "Cuentas a Cobrar" },
    { href: "/dashboard/productos", label: "Productos" },
    { href: "/dashboard/contabilidad", label: "Contabilidad" },
  ]

  it("filters menu items in fiado mode correctly", () => {
    const filtered = filterMenuItemsByModoLite(menuMock, "fiado")
    const labels = filtered.map(f => f.label)
    expect(labels).toContain("Dashboard")
    expect(labels).toContain("Libreta Fiado")
    expect(labels).toContain("Clientes")
    expect(labels).toContain("Configuración")
    expect(labels).not.toContain("Punto de Venta")
    expect(labels).not.toContain("Cuentas a Cobrar")
    expect(labels).not.toContain("Productos")
    expect(labels).not.toContain("Contabilidad")
  })

  it("filters menu items in cobranza mode correctly", () => {
    const filtered = filterMenuItemsByModoLite(menuMock, "cobranza")
    const labels = filtered.map(f => f.label)
    expect(labels).toContain("Dashboard")
    expect(labels).toContain("Clientes")
    expect(labels).toContain("Configuración")
    expect(labels).toContain("Cuentas a Cobrar")
    expect(labels).not.toContain("Libreta Fiado")
    expect(labels).not.toContain("Punto de Venta")
  })

  it("filters menu items in pos mode correctly", () => {
    const filtered = filterMenuItemsByModoLite(menuMock, "pos")
    const labels = filtered.map(f => f.label)
    expect(labels).toContain("Dashboard")
    expect(labels).toContain("Punto de Venta")
    expect(labels).toContain("Productos")
    expect(labels).toContain("Clientes")
    expect(labels).toContain("Configuración")
    expect(labels).not.toContain("Cuentas a Cobrar")
    expect(labels).not.toContain("Contabilidad")
  })

  it("keeps all menu items in completo mode", () => {
    const filtered = filterMenuItemsByModoLite(menuMock, "completo")
    expect(filtered).toHaveLength(menuMock.length)
  })
})
