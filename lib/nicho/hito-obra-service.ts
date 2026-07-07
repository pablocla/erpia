/**
 * Sprint 4 — Certificación de hitos de obra (% avance → cuenta por cobrar / factura).
 */

import { prisma } from "@/lib/prisma"

export interface CrearHitoInput {
  obraNombre: string
  hitoNombre: string
  porcentajeAvance: number
  monto: number
  clienteId?: number
  observaciones?: string
}

function db() {
  return prisma as any
}

export async function listHitosObra(empresaId: number, obraNombre?: string) {
  try {
    return await db().obraHitoCertificacion.findMany({
      where: {
        empresaId,
        ...(obraNombre ? { obraNombre } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  } catch {
    return []
  }
}

export async function crearHitoObra(empresaId: number, input: CrearHitoInput) {
  return db().obraHitoCertificacion.create({
    data: {
      empresaId,
      obraNombre: input.obraNombre,
      hitoNombre: input.hitoNombre,
      porcentajeAvance: input.porcentajeAvance,
      monto: input.monto,
      clienteId: input.clienteId ?? null,
      observaciones: input.observaciones ?? null,
      estado: "borrador",
    },
  })
}

export async function certificarHitoObra(empresaId: number, hitoId: number) {
  const hito = await db().obraHitoCertificacion.findFirst({
    where: { id: hitoId, empresaId },
  })
  if (!hito) throw new Error("Hito no encontrado")
  if (hito.estado === "certificado") return hito

  let cuentaCobrarId: number | null = null

  if (hito.clienteId) {
    const cc = await prisma.cuentaCobrar.create({
      data: {
        clienteId: hito.clienteId,
        numeroCuota: 1,
        montoOriginal: Number(hito.monto),
        saldo: Number(hito.monto),
        fechaEmision: new Date(),
        fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        estado: "pendiente",
        observaciones: `Hito obra: ${hito.hitoNombre} (${hito.porcentajeAvance}% avance)`,
      },
    })
    cuentaCobrarId = cc.id
  }

  return db().obraHitoCertificacion.update({
    where: { id: hitoId },
    data: {
      estado: "certificado",
      certificadaAt: new Date(),
      observaciones: cuentaCobrarId
        ? `${hito.observaciones ?? ""} · CC #${cuentaCobrarId}`.trim()
        : hito.observaciones,
    },
  })
}