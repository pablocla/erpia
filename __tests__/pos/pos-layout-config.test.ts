import { describe, it, expect } from "vitest"
import {
  getPosDeviceProfile,
  resolvePosLayout,
  mergePosLayoutOverrides,
  POS_BREAKPOINTS,
} from "@/lib/pos/pos-layout-config"

describe("pos-layout-config", () => {
  it("detecta perfiles por ancho", () => {
    expect(getPosDeviceProfile(390)).toBe("mobile")
    expect(getPosDeviceProfile(POS_BREAKPOINTS.tabletMin)).toBe("tablet")
    expect(getPosDeviceProfile(POS_BREAKPOINTS.desktopMin)).toBe("desktop")
  })

  it("mobile usa barra inferior y sheet, sin panel lateral", () => {
    const cfg = resolvePosLayout("mobile", "mostrador")
    expect(cfg.carrito.showBottomBar).toBe(true)
    expect(cfg.carrito.showCartSheet).toBe(true)
    expect(cfg.carrito.showSidePanel).toBe(false)
    expect(cfg.cobro.numpadDefaultOpen).toBe(false)
    expect(cfg.ux.hapticOnAdd).toBe(true)
  })

  it("tablet usa panel lateral sin barra inferior", () => {
    const cfg = resolvePosLayout("tablet", "mostrador")
    expect(cfg.carrito.showSidePanel).toBe(true)
    expect(cfg.carrito.showBottomBar).toBe(false)
    expect(cfg.carrito.showCartSheet).toBe(false)
    expect(cfg.productos.gridClass).toContain("grid-cols-3")
  })

  it("desktop habilita atajos y numpad abierto", () => {
    const cfg = resolvePosLayout("desktop", "mostrador")
    expect(cfg.ux.keyboardShortcuts).toBe(true)
    expect(cfg.cobro.numpadDefaultOpen).toBe(true)
    expect(cfg.carrito.showPendientesPanel).toBe(true)
  })

  it("kiosko oculta panel carrito en todos los perfiles", () => {
    for (const profile of ["mobile", "tablet", "desktop"] as const) {
      const cfg = resolvePosLayout(profile, "kiosko")
      expect(cfg.carrito.showSidePanel).toBe(false)
      expect(cfg.carrito.showPendientesPanel).toBe(false)
    }
  })

  it("mergePosLayoutOverrides permite parámetros extra", () => {
    const base = resolvePosLayout("mobile", "mostrador")
    const merged = mergePosLayoutOverrides(base, {
      ux: { touchMinPx: 48 },
      cobro: { numpadDefaultOpen: true },
    })
    expect(merged.ux.touchMinPx).toBe(48)
    expect(merged.cobro.numpadDefaultOpen).toBe(true)
    expect(merged.carrito.showBottomBar).toBe(true)
  })
})