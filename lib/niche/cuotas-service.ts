import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { MembresiasService } from "@/lib/membresias/membresias-service"
import { crearMovimientoNiche, listarMovimientosNiche } from "./movimientos-service"

/** Club / Mutuo — recicla Membresías + movimientos de cuota */
export async function listarSociosNiche(empresaId: number, appSku: string) {
  const [membresias, movimientos] = await Promise.all([
    MembresiasService.listarMembresias(empresaId),
    listarMovimientosNiche(empresaId, appSku, { categoria: "cuota", limit: 200 }),
  ])
  return { membresias, movimientos }
}

export async function registrarCuotaNiche(
  empresaId: number,
  appSku: string,
  input: {
    clienteId: number
    monto: number
    periodo: string
    titulo?: string
    marcarPagado?: boolean
  },
) {
  const mov = await crearMovimientoNiche(empresaId, {
    appSku,
    categoria: "cuota",
    titulo: input.titulo ?? `Cuota ${input.periodo}`,
    clienteId: input.clienteId,
    monto: input.monto,
    periodo: input.periodo,
    estado: input.marcarPagado ? "pagado" : "pendiente",
  })

  if (input.marcarPagado) {
    await prisma.cliente.update({
      where: { id: input.clienteId },
      data: { saldoCuentaCorriente: { decrement: input.monto } },
    })
  } else {
    await prisma.cliente.update({
      where: { id: input.clienteId },
      data: { saldoCuentaCorriente: { increment: input.monto } },
    })
  }

  return mov
}

export async function listarMorososCuota(empresaId: number, appSku: string) {
  return prisma.nicheMovimiento.findMany({
    where: whereEmpresa(empresaId, { appSku, categoria: "cuota", estado: "pendiente" }),
    include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
    orderBy: { createdAt: "desc" },
  })
}