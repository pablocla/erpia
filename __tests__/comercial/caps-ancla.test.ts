import { describe, it, expect } from "vitest"
import { DISPAROS_CONFIG } from "@/lib/comercial/paywall-disparo"
import {
  CAP_USUARIOS_ANCLA,
  CAP_CAJAS_ABIERTAS_ANCLA,
  HORAS_REPORTES_ANCLA,
  PAYLOAD_CAP_USUARIOS,
  PAYLOAD_CAP_CAJA,
  PAYLOAD_CAP_REPORTES,
  rangoSuperaAncla,
} from "@/lib/comercial/caps-ancla"

describe("Caps Ancla (1 Caja, 2 Usuarios, Reportes 48h)", () => {
  it("expone el payload 402 de 3er usuario para POST usuarios e invite", () => {
    expect(CAP_USUARIOS_ANCLA).toBe(2)
    expect(PAYLOAD_CAP_USUARIOS.codigo).toBe("CAP_USUARIOS_EXCEDIDO")
    expect(PAYLOAD_CAP_USUARIOS.disparoKey).toBe("tercer_usuario")
  })

  it("debe definir el límite de 2 usuarios para el plan gratuito", () => {
    const configTercerUser = DISPAROS_CONFIG.tercer_usuario
    expect(configTercerUser.skuRequerido).toBe("team.usuario_adicional")
    expect(configTercerUser.aclaracionGratis).toContain("2 usuarios")
  })

  it("debe definir el límite de 1 caja para el plan gratuito", () => {
    const configCaja = DISPAROS_CONFIG.segunda_caja
    expect(configCaja.skuRequerido).toBe("pos.segunda_caja")
    expect(configCaja.aclaracionGratis).toContain("1 caja")
  })

  it("debe definir el límite de 48h para métricas gratuitas", () => {
    const configReportes = DISPAROS_CONFIG.reportes_historicos
    expect(configReportes.skuRequerido).toBe("data.reportes_prog")
    expect(configReportes.aclaracionGratis).toContain("hoy y ayer")
  })

  it("expone payload 402 de 2ª caja y reportes", () => {
    expect(CAP_CAJAS_ABIERTAS_ANCLA).toBe(1)
    expect(HORAS_REPORTES_ANCLA).toBe(48)
    expect(PAYLOAD_CAP_CAJA.codigo).toBe("CAP_SEGUNDA_CAJA")
    expect(PAYLOAD_CAP_CAJA.disparoKey).toBe("segunda_caja")
    expect(PAYLOAD_CAP_REPORTES.codigo).toBe("CAP_REPORTES_48H")
    expect(PAYLOAD_CAP_REPORTES.disparoKey).toBe("reportes_historicos")
  })

  it("rango de hoy/ayer entra en el ancla; mes y 12 meses no", () => {
    const now = new Date("2026-08-26T18:00:00-03:00")
    const hoy = new Date("2026-08-26T00:00:00-03:00")
    const ayer = new Date("2026-08-25T00:00:00-03:00")
    const mes = new Date("2026-08-01T00:00:00-03:00")
    expect(rangoSuperaAncla(hoy, now, now)).toBe(false)
    expect(rangoSuperaAncla(ayer, now, now)).toBe(false)
    expect(rangoSuperaAncla(mes, now, now)).toBe(true)
    expect(rangoSuperaAncla(new Date("2025-08-26"), now, now)).toBe(true)
  })
})
