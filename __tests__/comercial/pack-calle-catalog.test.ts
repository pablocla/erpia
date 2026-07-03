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

  it("resuelve packs nicho con modoLite niche", () => {
    const starter = resolvePackCalle("pool-claver-nicho")
    expect(starter?.modoLite).toBe("niche")
    expect(starter?.landingPath).toBe("/dashboard/nicho")
    expect(skusParaActivar("pool-propiedad")).toContain("niche.consorcios")
    expect(skusParaActivar("pool-calle-nicho")).toContain("pos.fiado_barrio")
  })

  it("resuelve packs calle Tier A", () => {
    const servicios = resolvePackCalle("pool-servicios-barrio")
    expect(servicios?.modoLite).toBe("niche")
    expect(skusParaActivar("pool-servicios-barrio")).toContain("niche.peluqueria_barrio")
    expect(skusParaActivar("pool-escuela-barrio")).toContain("niche.escuela_barrio")
    expect(skusParaActivar("pool-deportes-barrio")).toContain("niche.cancha_barrio")
  })

  it("infiere modo lite niche para SKU individual", () => {
    expect(inferModoLiteFromEnganche("niche.consorcios")).toBe("niche")
    expect(inferModoLiteFromEnganche("niche.tintoreria")).toBe("niche")
  })

  it("prestamista usa modoLite fiado", () => {
    expect(inferModoLiteFromEnganche("niche.prestamo_barrio")).toBe("fiado")
    const pack = resolvePackCalle("niche.prestamo_barrio")
    expect(pack?.modoLite).toBe("fiado")
    expect(pack?.landingPath).toBe("/dashboard/fiado")
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

  it("filters menu items in niche mode", () => {
    const nicheMenu = [
      ...menuMock,
      { href: "/dashboard/nicho", label: "Claver Nicho" },
      { href: "/dashboard/nicho/club", label: "Club" },
      { href: "/dashboard/apps", label: "App Store" },
      { href: "/dashboard/historia-clinica", label: "Historia clínica" },
    ]
    const filtered = filterMenuItemsByModoLite(nicheMenu, "niche")
    const hrefs = filtered.map((f) => f.href)
    expect(hrefs).toContain("/dashboard/nicho")
    expect(hrefs).toContain("/dashboard/nicho/club")
    expect(hrefs).toContain("/dashboard/apps")
    expect(hrefs).toContain("/dashboard/historia-clinica")
    expect(hrefs).not.toContain("/dashboard/pos")
  })
})