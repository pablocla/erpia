import { describe, expect, it } from "vitest"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import { PACKS_HOME_STRIP } from "@/lib/comercial/commercial-packaging"
import {
  COBRA_ENTRY,
  COMBATE_APPS,
  COMBATE_APPS_SLUGS,
  ENTRY_DOOR_SLUG,
  FIADO_ENTRY,
  GTM_VITRINE_COPY,
  HOME_COMBATE_SLUGS,
  HOME_DOLOR_CHIPS,
  MONOTRIBUTO_ENTRY,
  OBRA_ENTRY,
  PRODUCT_ENTRIES,
  PROPIEDAD_ENTRY,
  SERVICIOS_ENTRY,
  TURNOS_ENTRY,
  combateLandingMetadata,
  getProductEntry,
  homeCombateApps,
  isCombateAppSlug,
  isHomeDolorSlug,
  resolveHomeDolor,
  ventasWhatsappMessage,
} from "@/lib/comercial/go-to-market-vitrine"

describe("go-to-market-vitrine", () => {
  it("usa oficios como puerta de entrada principal", () => {
    expect(ENTRY_DOOR_SLUG).toBe("oficios")
    expect(FIADO_ENTRY.h1.toLowerCase()).toContain("cuaderno")
    expect(FIADO_ENTRY.ctaPrimaryActivar).toBe("fiado")
  })

  it("expone productos de combate incluyendo propiedad y oficios", () => {
    expect(COMBATE_APPS_SLUGS).toContain("oficios")
    expect(COMBATE_APPS_SLUGS).toContain("propiedad")
    expect(COMBATE_APPS_SLUGS).toContain("monotributo")
    expect(COMBATE_APPS_SLUGS).toContain("servicios")
    expect(COMBATE_APPS_SLUGS).toContain("obra")
    expect(COMBATE_APPS.map((a) => a.slug)).toContain("oficios")
    expect(COMBATE_APPS.find((a) => a.slug === "oficios")?.sku).toBe("niche.oficios")
  })

  it("home muestra oficios, fiado y turnos", () => {
    expect(HOME_COMBATE_SLUGS).toEqual(["oficios", "fiado", "turnos"])
    expect(homeCombateApps().map((a) => a.slug)).toEqual(["oficios", "fiado", "turnos"])
    expect(HOME_DOLOR_CHIPS).toHaveLength(3)
    expect(resolveHomeDolor(null)).toBe("oficios")
    expect(resolveHomeDolor("oficios")).toBe("oficios")
    expect(resolveHomeDolor("fiado")).toBe("fiado")
    expect(resolveHomeDolor("turnos")).toBe("turnos")
    expect(resolveHomeDolor("propiedad")).toBe("oficios")
    expect(isHomeDolorSlug("oficios")).toBe(true)
    expect(isHomeDolorSlug("pos")).toBe(false)
  })

  it("CTAs de home usan register?activar=", () => {
    for (const slug of HOME_COMBATE_SLUGS) {
      const href = activarRegisterHref(slug)
      expect(href).toContain("/login/register?")
      expect(href).toContain(`activar=${slug}`)
      if (slug === "fiado" || slug === "oficios") {
        expect(href).not.toContain("trial=14")
      } else {
        expect(href).toContain("trial=14")
      }
      expect(PRODUCT_ENTRIES[slug].ctaPrimaryActivar).toBe(slug)
    }
  })

  it("mensaje de WhatsApp de ventas menciona el producto del dolor", () => {
    expect(ventasWhatsappMessage("fiado")).toMatch(/Fiado|fiado/i)
    expect(ventasWhatsappMessage("cobra")).toMatch(/Cobrá|cobranza|WhatsApp/i)
    expect(ventasWhatsappMessage("turnos")).toMatch(/Turnos|turno|turnero/i)
  })

  it("strip de packs en home tiene 3–4 packs con precio", () => {
    expect(PACKS_HOME_STRIP.length).toBeGreaterThanOrEqual(3)
    expect(PACKS_HOME_STRIP.length).toBeLessThanOrEqual(4)
    for (const pack of PACKS_HOME_STRIP) {
      expect(pack.precioArs).toBeGreaterThan(0)
      expect(pack.id).toBeTruthy()
    }
  })

  it("alinea copy GTM con hero fiado", () => {
    expect(GTM_VITRINE_COPY.heroTagline).toBe(FIADO_ENTRY.h1)
    expect(GTM_VITRINE_COPY.combateHeadingId).toBe("combate-heading")
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