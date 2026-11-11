/**
 * Resolución de la caja destino de una venta POS.
 *
 * - Con cajaId: debe ser de la empresa (400 si no) y estar abierta (409 si no).
 * - Sin cajaId: EXACTAMENTE el comportamiento previo (findFirst de caja abierta por empresaId).
 *   Solo si la empresa tiene el opt-in explícito `caja_seleccion_obligatoria`
 *   (FeatureEmpresa activado=true, lo setea únicamente provision-velde) y hay 2+ cajas
 *   abiertas, se exige cajaId (409 CAJA_REQUERIDA).
 */
import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"

/** FeatureEmpresa opt-in: exigir cajaId en la venta cuando hay 2+ cajas abiertas. */
export const FEATURE_CAJA_SELECCION_OBLIGATORIA = "caja_seleccion_obligatoria"

export type ResolverCajaResult =
  | { ok: true; cajaId: number }
  | { ok: false; status: 400 | 409; error: string; codigo: string }

/** Solo override explícito de la empresa (sin cascada de rubro). */
export async function cajaSeleccionObligatoria(empresaId: number): Promise<boolean> {
  const row = await prisma.featureEmpresa.findUnique({
    where: { empresaId_featureKey: { empresaId, featureKey: FEATURE_CAJA_SELECCION_OBLIGATORIA } },
    select: { activado: true },
  })
  return row?.activado === true
}

export async function resolverCajaVenta(
  empresaId: number,
  cajaId?: number,
): Promise<ResolverCajaResult> {
  if (cajaId) {
    const caja = await prisma.caja.findFirst({
      where: whereEmpresa(empresaId, { id: cajaId }),
      select: { id: true, estado: true },
    })
    if (!caja) {
      return { ok: false, status: 400, error: "Caja no encontrada en esta empresa", codigo: "CAJA_NO_ENCONTRADA" }
    }
    if (caja.estado !== "abierta") {
      return { ok: false, status: 409, error: "La caja elegida no está abierta", codigo: "CAJA_NO_ABIERTA" }
    }
    return { ok: true, cajaId: caja.id }
  }

  // Comportamiento histórico (idéntico a main): primera caja abierta de la empresa.
  const caja = await prisma.caja.findFirst({
    where: { empresaId, estado: "abierta" },
  })
  if (!caja) {
    return {
      ok: false,
      status: 400,
      error: "No hay caja abierta. Abrí la caja antes de facturar.",
      codigo: "SIN_CAJA_ABIERTA",
    }
  }

  // Opt-in explícito por empresa (hoy solo Velde): con 2+ abiertas hay que elegir.
  if (await cajaSeleccionObligatoria(empresaId)) {
    const abiertas = await prisma.caja.count({ where: whereEmpresa(empresaId, { estado: "abierta" }) })
    if (abiertas > 1) {
      return {
        ok: false,
        status: 409,
        error: "Hay más de una caja abierta: elegí en qué caja registrar la venta.",
        codigo: "CAJA_REQUERIDA",
      }
    }
  }
  return { ok: true, cajaId: caja.id }
}
