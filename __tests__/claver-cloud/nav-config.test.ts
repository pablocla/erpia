import { describe, it, expect } from "vitest"
import { navSections, allNavItems, isNavItemActive } from "@/lib/claver-cloud/nav-config"
import esMessages from "@/messages/es.json"

describe("Claver Cloud Navigation Config & Localization Integrity", () => {
  it("debe contener las 4 secciones principales", () => {
    const labels = navSections.map((s) => s.label)
    expect(labels).toContain("negocio")
    expect(labels).toContain("platform")
    expect(labels).toContain("integraciones")
    expect(labels).toContain("admin")
  })

  it("cada sección debe tener items con rutas absolutas de Claver Cloud", () => {
    for (const section of navSections) {
      expect(section.items.length).toBeGreaterThan(0)
      for (const item of section.items) {
        expect(item.href.startsWith("/claver-cloud")).toBe(true)
        expect(typeof item.name).toBe("string")
        expect(item.icon).toBeDefined()
      }
    }
  })

  it("todas las secciones deben tener traducción en messages/es.json", () => {
    const cloudNavSections = (esMessages as any).cloudNav?.sections
    expect(cloudNavSections).toBeDefined()

    for (const section of navSections) {
      expect(cloudNavSections[section.label]).toBeDefined()
      expect(typeof cloudNavSections[section.label]).toBe("string")
      expect(cloudNavSections[section.label].length).toBeGreaterThan(0)
    }
  })

  it("todos los items de navegación deben tener traducción en messages/es.json", () => {
    const cloudNavItems = (esMessages as any).cloudNav?.items
    expect(cloudNavItems).toBeDefined()

    for (const item of allNavItems) {
      expect(cloudNavItems[item.name]).toBeDefined()
      expect(typeof cloudNavItems[item.name]).toBe("string")
      expect(cloudNavItems[item.name].length).toBeGreaterThan(0)
    }
  })

  it("isNavItemActive debe resolver correctamente rutas exactas y con prefijos", () => {
    const commandCenter = allNavItems.find((i) => i.name === "commandCenter")!
    expect(isNavItemActive("/claver-cloud", commandCenter)).toBe(true)
    expect(isNavItemActive("/claver-cloud/analytics", commandCenter)).toBe(false)

    const fleet = allNavItems.find((i) => i.name === "fleet")!
    expect(isNavItemActive("/claver-cloud/operations", fleet)).toBe(true)
    expect(isNavItemActive("/claver-cloud/tenants", fleet)).toBe(true)
    expect(isNavItemActive("/claver-cloud/tenants/42", fleet)).toBe(true)
    expect(isNavItemActive("/claver-cloud/organizations", fleet)).toBe(true)

    const goLive = allNavItems.find((i) => i.name === "goLive")!
    expect(isNavItemActive("/claver-cloud/go-live", goLive)).toBe(true)
    expect(isNavItemActive("/claver-cloud/implementation", goLive)).toBe(true)
  })
})
