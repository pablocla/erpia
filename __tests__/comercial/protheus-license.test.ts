import { describe, expect, it } from "vitest"
import {
  isProtheusDashboardPath,
  isProtheusLicenseSku,
  protheusAccessBlocked,
  vigenciaHastaLicenciaProtheus,
} from "@/lib/comercial/protheus-license"
import { inferModoLiteFromEnganche, landingPathParaModoLite } from "@/lib/comercial/pack-calle-catalog"
import { isMenuItemAllowedInModoLite } from "@/lib/comercial/lite-sidebar"
import { resolveAutoSubscribe } from "@/lib/comercial/product-auto-subscribe"

describe("licencia Protheus", () => {
  it("no mezcla el trial ERP con las rutas Protheus", () => {
    expect(isProtheusDashboardPath("/dashboard/protheus")).toBe(true)
    expect(isProtheusDashboardPath("/dashboard/protheus/licencia")).toBe(true)
    expect(isProtheusDashboardPath("/dashboard/banco")).toBe(false)
  })

  it("bloquea solo baja o vencida", () => {
    expect(protheusAccessBlocked("none")).toBe(false)
    expect(protheusAccessBlocked("active")).toBe(false)
    expect(protheusAccessBlocked("expired")).toBe(true)
    expect(protheusAccessBlocked("cancelled")).toBe(true)
  })

  it("alta comercial arranca perfil tesorería y licencia anual sin MP", () => {
    expect(inferModoLiteFromEnganche("edge.investments")).toBe("protheus")
    expect(landingPathParaModoLite("protheus")).toBe("/dashboard/protheus")
    expect(isMenuItemAllowedInModoLite("/dashboard/protheus", "protheus")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/pos", "protheus")).toBe(false)
    const sub = resolveAutoSubscribe("edge.investments", { context: "register" })
    expect(sub.canAutoActivate).toBe(true)
    expect(sub.requiresPayment).toBe(false)
    expect(sub.trialEligible).toBe(false)
    expect(isProtheusLicenseSku("edge.investments")).toBe(true)
    const from = new Date("2026-06-15T12:00:00Z")
    const hasta = vigenciaHastaLicenciaProtheus(from)
    expect(hasta.getTime() - from.getTime()).toBeGreaterThan(360 * 24 * 60 * 60 * 1000)
  })
})
