import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import type { NicheResumen } from "./types"

export async function listarMovimientosNiche(
  empresaId: number,
  appSku: string,
  opts?: { estado?: string; categoria?: string; limit?: number },
) {
  return prisma.nicheMovimiento.findMany({
    where: whereEmpresa(empresaId, {
      appSku,
      ...(opts?.estado ? { estado: opts.estado } : {}),
      ...(opts?.categoria ? { categoria: opts.categoria } : {}),
    }),
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  })
}

export async function crearMovimientoNiche(
  empresaId: number,
  data: {
    appSku: string
    categoria: string
    titulo: string
    clienteId?: number
    monto?: number
    estado?: string
    periodo?: string
    venceEn?: Date
    metadata?: Record<string, unknown>
  },
) {
  return prisma.nicheMovimiento.create({
    data: {
      empresaId,
      appSku: data.appSku,
      categoria: data.categoria,
      titulo: data.titulo,
      clienteId: data.clienteId,
      monto: data.monto ?? 0,
      estado: data.estado ?? "pendiente",
      periodo: data.periodo,
      venceEn: data.venceEn,
      metadata: data.metadata ?? undefined,
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
  })
}

export async function actualizarEstadoMovimiento(
  empresaId: number,
  id: number,
  estado: string,
) {
  const row = await prisma.nicheMovimiento.findFirst({
    where: whereEmpresa(empresaId, { id }),
  })
  if (!row) throw new Error("Movimiento no encontrado")
  return prisma.nicheMovimiento.update({
    where: { id },
    data: { estado },
    include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
  })
}

export async function resumenNiche(empresaId: number, appSku: string): Promise<NicheResumen> {
  const rows = await prisma.nicheMovimiento.findMany({
    where: whereEmpresa(empresaId, { appSku }),
    select: { estado: true, monto: true },
  })
  let pendientes = 0
  let pagados = 0
  let montoPendiente = 0
  let montoTotal = 0
  for (const r of rows) {
    const m = Number(r.monto)
    montoTotal += m
    if (r.estado === "pendiente" || r.estado === "listo") {
      pendientes++
      montoPendiente += m
    } else if (r.estado === "pagado" || r.estado === "confirmado") {
      pagados++
    }
  }
  return {
    total: rows.length,
    pendientes,
    pagados,
    montoPendiente,
    montoTotal,
  }
}