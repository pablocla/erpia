import { describe, it, expect } from "vitest"
import { resolveBuenDiaConfig } from "../lib/dashboard/buen-dia-config"
import { DollarSign, FileText, Package, Wallet, Users, CalendarDays, UtensilsCrossed } from "lucide-react"

describe("resolveBuenDiaConfig", () => {
  it("debería devolver configuración para el modo lite 'fiado'", () => {
    const config = resolveBuenDiaConfig("fiado", "kiosco")
    expect(config.kpis).toHaveLength(3)
    expect(config.kpis.map(k => k.id)).toEqual(["deuda_total", "clientes_deuda", "fiados_hoy"])
  })

  it("debería devolver configuración para el modo lite 'cobranza'", () => {
    const config = resolveBuenDiaConfig("cobranza", "kiosco")
    expect(config.kpis).toHaveLength(2)
    expect(config.kpis.map(k => k.id)).toEqual(["cxc_vencido", "morosos"])
  })

  it("debería devolver configuración de nicho para 'veterinaria' con cualquier modo completo", () => {
    const config = resolveBuenDiaConfig("completo", "veterinaria")
    expect(config.kpis).toHaveLength(2)
    expect(config.kpis.map(k => k.id)).toEqual(["turnos_hoy", "ventas_hoy"])
    expect(config.kpis[0].fallbackLink).toBe("/dashboard/agenda")
  })

  it("debería devolver configuración de nicho para 'bar_restaurant'", () => {
    const config = resolveBuenDiaConfig("completo", "bar_restaurant")
    expect(config.kpis).toHaveLength(2)
    expect(config.kpis.map(k => k.id)).toEqual(["mesas_abiertas", "ventas_hoy"])
    expect(config.kpis[0].fallbackLink).toBe("/dashboard/hospitalidad")
  })

  it("debería devolver configuración default para POS / kiosco modo completo", () => {
    const config = resolveBuenDiaConfig("completo", "kiosco")
    expect(config.kpis).toHaveLength(4)
    expect(config.kpis.map(k => k.id)).toEqual(["ventas_hoy", "tickets_hoy", "stock_bajo", "estado_caja"])
    expect(config.kpis[2].fallbackLink).toBe("/dashboard/productos")
  })
})
