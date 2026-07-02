import { describe, expect, it } from "vitest"
import {
  engancheParaRubro,
  inferModoLiteFromEnganche,
  resolvePackCalle,
  skusParaActivar,
} from "@/lib/comercial/pack-calle-catalog"
import { filterMenuItemsByModoLite } from "@/lib/comercial/lite-sidebar"

describe("pack-calle-catalog", () => {
  it("resuelve Libreta Fiado para almacén", () => {
    expect(engancheParaRubro("almacen")).toBe("pos.fiado_barrio")
    const pack = resolvePackCalle("pos.fiado_barrio")
    expect(pack?.nombre).toBe("Libreta Fiado")
    expect(pack?.modoLite).toBe("fiado")
    expect(pack?.precioArs).toBe(4990)
  })

  it("resuelve pack almacén barrio con SKUs", () => {
    const pack = resolvePackCalle("pool-almacen-barrio")
    expect(pack?.tipo).toBe("pack")
    expect(skusParaActivar("pool-almacen-barrio")).toContain("pos.fiado_barrio")
    expect(skusParaActivar("pool-almacen-barrio")).toContain("intang.cobranzas_wa")
  })

  it("infiere modo lite por dolor", () => {
    expect(inferModoLiteFromEnganche("indefinido", "fiado")).toBe("fiado")
    expect(inferModoLiteFromEnganche("indefinido", "cobranza")).toBe("cobranza")
  })
})

describe("lite-sidebar", () => {
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
    const labels = filtered.map((f) => f.label)
    expect(labels).toContain("Libreta Fiado")
    expect(labels).not.toContain("Punto de Venta")
    expect(labels).not.toContain("Contabilidad")
  })

  it("keeps all menu items in completo mode", () => {
    expect(filterMenuItemsByModoLite(menuMock, "completo")).toHaveLength(menuMock.length)
  })
})