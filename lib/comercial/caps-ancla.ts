import { prisma } from "@/lib/prisma"
import { canWriteAnySku } from "@/lib/comercial/comercial-access-service"
import { DISPAROS_CONFIG } from "@/lib/comercial/paywall-disparo"

export const CAP_USUARIOS_ANCLA = 2
export const CAP_CAJAS_ABIERTAS_ANCLA = 1
export const HORAS_REPORTES_ANCLA = 48

export const PAYLOAD_CAP_USUARIOS = {
  error: "Límite de usuarios del plan gratuito alcanzado",
  codigo: "CAP_USUARIOS_EXCEDIDO" as const,
  mensaje: DISPAROS_CONFIG.tercer_usuario.descripcion,
  disparoKey: "tercer_usuario" as const,
}

export const PAYLOAD_CAP_CAJA = {
  error: "El plan gratis incluye 1 caja abierta. Para otra en paralelo, activá el extra.",
  codigo: "CAP_SEGUNDA_CAJA" as const,
  mensaje: DISPAROS_CONFIG.segunda_caja.descripcion,
  disparoKey: "segunda_caja" as const,
}

export const PAYLOAD_CAP_REPORTES = {
  error: "Los reportes de hoy y ayer son gratis. Más de 48 h requiere el extra.",
  codigo: "CAP_REPORTES_48H" as const,
  mensaje: DISPAROS_CONFIG.reportes_historicos.descripcion,
  disparoKey: "reportes_historicos" as const,
}

/** Dueño + 1 cajero en ancla. Extra: team.usuario_adicional | core.claver. */
export async function anclaPuedeSumarUsuario(empresaId: number): Promise<boolean> {
  const activos = await prisma.usuario.count({
    where: { empresaId, activo: true, deletedAt: null },
  })
  if (activos < CAP_USUARIOS_ANCLA) return true
  return canWriteAnySku(empresaId, ["team.usuario_adicional", "core.claver"], "any")
}

/**
 * 0 cajas abiertas → se puede abrir la primera (ancla).
 * Ya hay ≥1 abierta → hace falta pos.segunda_caja | core.claver.
 * No confundir con 409 de “cerrá esta antes”: eso era bloquear también al que pagó.
 */
export async function anclaPuedeAbrirOtraCaja(empresaId: number): Promise<boolean> {
  const abiertas = await prisma.caja.count({
    where: { empresaId, estado: "abierta" },
  })
  if (abiertas < CAP_CAJAS_ABIERTAS_ANCLA) return true
  return canWriteAnySku(empresaId, DISPAROS_CONFIG.segunda_caja.skusValidos, "any")
}

export function rangoSuperaAncla(desde: Date, hasta: Date, now = new Date()): boolean {
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return true
  const spanMs = Math.abs(hasta.getTime() - desde.getTime())
  const maxMs = HORAS_REPORTES_ANCLA * 60 * 60 * 1000
  if (spanMs > maxMs) return true
  if (now.getTime() - Math.min(desde.getTime(), hasta.getTime()) > maxMs) return true
  return false
}

export async function anclaPuedeVerRango(
  empresaId: number,
  desde: Date,
  hasta: Date,
  now = new Date(),
): Promise<boolean> {
  if (!rangoSuperaAncla(desde, hasta, now)) return true
  return canWriteAnySku(empresaId, DISPAROS_CONFIG.reportes_historicos.skusValidos, "any")
}
