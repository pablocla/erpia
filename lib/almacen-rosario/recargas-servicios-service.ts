/**
 * Recargas SUBE, celular y servicios en mostrador.
 */
import { prisma } from "@/lib/prisma"

export const RECARGAS_DEFAULT = [
  { id: "sube", nombre: "SUBE", comisionPct: 3 },
  { id: "movistar", nombre: "Movistar", comisionPct: 5 },
  { id: "claro", nombre: "Claro", comisionPct: 5 },
  { id: "personal", nombre: "Personal", comisionPct: 5 },
  { id: "directv", nombre: "DirecTV", comisionPct: 4 },
] as const

export async function registrarRecargaServicio(input: {
  empresaId: number
  servicioId: string
  monto: number
  referencia?: string
  observaciones?: string
}) {
  if (input.monto <= 0) throw new Error("El monto debe ser mayor a cero")

  const servicio = RECARGAS_DEFAULT.find((s) => s.id === input.servicioId)
  if (!servicio) throw new Error("Servicio no encontrado")

  const caja = await prisma.caja.findFirst({
    where: { empresaId: input.empresaId, estado: "abierta" },
  })
  if (!caja) throw new Error("Abrí la caja para registrar recargas")

  const comision = Math.round(input.monto * (servicio.comisionPct / 100) * 100) / 100

  await prisma.movimientoCaja.create({
    data: {
      cajaId: caja.id,
      tipo: "ingreso",
      concepto: `Recarga ${servicio.nombre}`,
      monto: input.monto,
      medioPago: "efectivo",
      referencia: input.referencia ?? `REC-${servicio.id}`,
    },
  })

  return {
    servicio: servicio.nombre,
    monto: input.monto,
    comisionEstimada: comision,
    comisionPct: servicio.comisionPct,
  }
}