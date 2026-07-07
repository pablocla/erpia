import { describe, expect, it } from "vitest"
import {
  COBRA_ENTRY,
  COMBATE_APPS,
  COMBATE_APPS_SLUGS,
  ENTRY_DOOR_SLUG,
  FIADO_ENTRY,
  GTM_VITRINE_COPY,
  MONOTRIBUTO_ENTRY,
  OBRA_ENTRY,
  PROPIEDAD_ENTRY,
  SERVICIOS_ENTRY,
  TURNOS_ENTRY,
  combateLandingMetadata,
  getProductEntry,
  isCombateAppSlug,
} from "@/lib/comercial/go-to-market-vitrine"

describe("go-to-market-vitrine", () => {
  it("usa fiado como puerta de entrada principal", () => {
    expect(ENTRY_DOOR_SLUG).toBe("fiado")
    expect(FIADO_ENTRY.h1.toLowerCase()).toContain("cuaderno")
    expect(FIADO_ENTRY.ctaPrimaryActivar).toBe("fiado")
  })

  it("expone productos de combate incluyendo propiedad", () => {
    expect(COMBATE_APPS_SLUGS).toContain("propiedad")
    expect(COMBATE_APPS_SLUGS).toContain("monotributo")
    expect(COMBATE_APPS_SLUGS).toContain("servicios")
    expect(COMBATE_APPS_SLUGS).toContain("obra")
    expect(COMBATE_APPS.map((a) => a.slug)).toContain("propiedad")
    expect(COMBATE_APPS.find((a) => a.slug === "propiedad")?.sku).toBe("pool-propiedad")
  })

  it("alinea copy GTM con hero fiado", () => {
    expect(GTM_VITRINE_COPY.heroTagline).toBe(FIADO_ENTRY.h1)
    expect(FIADO_ENTRY.steps).toHaveLength(3)
    expect(FIADO_ENTRY.benefits.length).toBeGreaterThanOrEqual(3)
  })

  it("resuelve entries de fiado, cobra, propiedad y turnos", () => {
    expect(getProductEntry("fiado")).toBe(FIADO_ENTRY)
    expect(getProductEntry("cobra")).toBe(COBRA_ENTRY)
    expect(getProductEntry("monotributo")).toBe(MONOTRIBUTO_ENTRY)
    expect(getProductEntry("servicios")).toBe(SERVICIOS_ENTRY)
    expect(getProductEntry("obra")).toBe(OBRA_ENTRY)
    expect(getProductEntry("propiedad")).toBe(PROPIEDAD_ENTRY)
    expect(getProductEntry("turnos")).toBe(TURNOS_ENTRY)
    expect(getProductEntry("tienda")).toBeNull()
    expect(isCombateAppSlug("propiedad")).toBe(true)
    expect(isCombateAppSlug("tienda")).toBe(false)
    expect(PROPIEDAD_ENTRY.demoHref).toBe("/demo/inmobiliaria")
  })

  it("expone metadata SEO para landings de combate", () => {
    const fiado = combateLandingMetadata("fiado")
    expect(fiado.title).toContain("Claver Fiado")
    expect(fiado.description).toContain(FIADO_ENTRY.subtitle)

    const cobra = combateLandingMetadata("cobra")
    expect(cobra.title).toContain("Claver Cobrá")
    expect(cobra.keywords).toContain("cobranzas WhatsApp")

    const turnos = combateLandingMetadata("turnos")
    expect(turnos.title).toContain("Claver Turnos")
    expect(turnos.keywords).toContain("turnero online")
    expect(TURNOS_ENTRY.demoHref).toBe("/demo/salon_belleza")
    expect(COBRA_ENTRY.ctaPrimaryActivar).toBe("cobra")
  })
})