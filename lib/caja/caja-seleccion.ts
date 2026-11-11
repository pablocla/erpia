/**
 * Resolución de la caja destino de una venta POS.
 *
 * - Con cajaId: debe ser de la empresa (400 si no) y estar abierta (409 si no).
 * - Sin cajaId y 1 caja abierta: comportamiento histórico (esa caja).
 * - Sin cajaId y 0 abiertas: 400 "No hay caja abierta".
 * - Sin cajaId y 2+ abiertas: 409, hay que elegir (no se elige al azar).
 */
import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"

export type ResolverCajaResult =
  | { ok: true; cajaId: number }
  | { ok: false; status: 400 | 409; error: string; codigo: string }

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

  const abiertas = await prisma.caja.findMany({
    where: whereEmpresa(empresaId, { estado: "abierta" }),
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 2,
  })
  if (abiertas.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "No hay caja abierta. Abrí la caja antes de facturar.",
      codigo: "SIN_CAJA_ABIERTA",
    }
  }
  if (abiertas.length > 1) {
    return {
      ok: false,
      status: 409,
      error: "Hay más de una caja abierta: elegí en qué caja registrar la venta.",
      codigo: "CAJA_REQUERIDA",
    }
  }
  return { ok: true, cajaId: abiertas[0].id }
}
