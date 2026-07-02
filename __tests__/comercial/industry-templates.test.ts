import { describe, it, expect } from "vitest"
import {
  getIndustryTemplate,
  getGoldenPathForRubro,
  getMenuLabelForRubro,
  resolveIndustryContext,
  INDUSTRY_TEMPLATES,
} from "@/lib/comercial/industry-templates"

describe("industry-templates", () => {
  it("tiene industrias clave del conglomerado", () => {
    const ids = INDUSTRY_TEMPLATES.map((t) => t.id)
    expect(ids).toContain("veterinaria")
    expect(ids).toContain("gimnasio")
    expect(ids).toContain("estacion_servicio")
    expect(ids).toContain("almacen")
    expect(ids).toContain("bar_restaurant")
    expect(ids).toContain("agro_acopio")
  })

  it("golden path veterinaria → historia clínica", () => {
    const t = getIndustryTemplate("veterinaria")
    expect(t?.goldenPath).toBe("/dashboard/historia-clinica")
    expect(getGoldenPathForRubro("veterinaria")).toBe("/dashboard/historia-clinica")
  })

  it("golden path gimnasio → membresías", () => {
    expect(getGoldenPathForRubro("gimnasio")).toBe("/dashboard/membresias")
  })

  it("golden path kiosco/almacén → fiado", () => {
    expect(getIndustryTemplate("almacen")?.goldenPath).toBe("/dashboard/fiado")
    expect(getGoldenPathForRubro("kiosco")).toBe("/dashboard/fiado")
  })

  it("golden path estación → cuentas a cobrar flotas", () => {
    expect(getGoldenPathForRubro("estacion_servicio")).toBe("/dashboard/cuentas-cobrar")
  })

  it("renombra labels del menú por rubro", () => {
    const label = getMenuLabelForRubro("/dashboard/fiado", "Libreta Fiado", "kiosco")
    expect(label).toBe("Quién me debe")
  })

  it("almacen es retail con enganche fiado", () => {
    const t = getIndustryTemplate("almacen")
    expect(t?.isRetail).toBe(true)
    expect(t?.engancheId).toBe("pos.fiado_barrio")
    expect(t?.rubro).toBe("kiosco")
  })

  it("resolveIndustryContext prioriza industryId sobre rubro kiosco", () => {
    const ctx = resolveIndustryContext("kiosco", "almacen")
    expect(ctx?.id).toBe("almacen")
    expect(ctx?.label).toBe("Almacén de barrio")
    const label = getMenuLabelForRubro("/dashboard/productos", "Productos", "kiosco", "almacen")
    expect(label).toBe("Inventario")
  })
})