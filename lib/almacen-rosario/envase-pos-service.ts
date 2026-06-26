/**
 * Préstamo/devolución de envases de gaseosas en POS con depósito en caja.
 */
import { prisma } from "@/lib/prisma"

export const TIPOS_ENVASE_GASEOSA_DEFAULT = [
  { nombre: "Cajón Coca 2.25L x8", valorDeposito: 3500, capacidad: 8 },
  { nombre: "Cajón Sprite 2.25L x8", valorDeposito: 3500, capacidad: 8 },
  { nombre: "Cajón retornable 1.5L x12", valorDeposito: 4200, capacidad: 12 },
  { nombre: "Sifón 2L retornable", valorDeposito: 2500, capacidad: 2 },
  { nombre: "Bidón 20L agua", valorDeposito: 8000, capacidad: 20 },
] as const

export async function asegurarTiposEnvaseGaseosa(empresaId: number) {
  const db = prisma as typeof prisma & {
    tipoEnvase: {
      findFirst: (args: object) => Promise<unknown>
      create: (args: object) => Promise<unknown>
    }
  }

  for (const t of TIPOS_ENVASE_GASEOSA_DEFAULT) {
    const existe = await db.tipoEnvase.findFirst({
      where: { empresaId, nombre: t.nombre },
    })
    if (!existe) {
      await db.tipoEnvase.create({
        data: {
          empresaId,
          nombre: t.nombre,
          capacidad: t.capacidad,
          unidadMedida: "unidades",
          valorDeposito: t.valorDeposito,
          activo: true,
        },
      })
    }
  }
}

export async function registrarMovimientoEnvasePos(input: {
  empresaId: number
  tipoEnvaseId: number
  tipo: "entrega" | "retorno"
  cantidad: number
  clienteId?: number
  facturaId?: number
  observaciones?: string
  cobrarDeposito?: boolean
}) {
  const db = prisma as typeof prisma & {
    tipoEnvase: { findFirst: (args: object) => Promise<{ valorDeposito: unknown; nombre: string } | null> }
    movimientoEnvase: { create: (args: object) => Promise<{ id: number }> }
  }

  if (input.tipo === "entrega" && !input.clienteId) {
    throw new Error("Seleccioná un cliente para prestar envases")
  }

  const tipoEnvase = await db.tipoEnvase.findFirst({
    where: { id: input.tipoEnvaseId, empresaId: input.empresaId, activo: true },
  })
  if (!tipoEnvase) throw new Error("Tipo de envase no encontrado")

  const movimiento = await db.movimientoEnvase.create({
    data: {
      empresaId: input.empresaId,
      tipoEnvaseId: input.tipoEnvaseId,
      tipo: input.tipo,
      cantidad: input.cantidad,
      clienteId: input.clienteId,
      facturaId: input.facturaId,
      observaciones: input.observaciones,
    },
  })

  let montoCaja = 0
  if (input.cobrarDeposito) {
    const deposito = Number(tipoEnvase.valorDeposito) * input.cantidad
    if (deposito > 0) {
      const caja = await prisma.caja.findFirst({
        where: { empresaId: input.empresaId, estado: "abierta" },
      })
      if (!caja) throw new Error("Abrí la caja para cobrar/devolver depósito de envase")

      montoCaja = deposito
      await prisma.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: input.tipo === "entrega" ? "ingreso" : "egreso",
          concepto:
            input.tipo === "entrega"
              ? `Depósito envase: ${tipoEnvase.nombre} x${input.cantidad}`
              : `Devolución depósito envase: ${tipoEnvase.nombre} x${input.cantidad}`,
          monto: deposito,
          medioPago: "efectivo",
          referencia: `ENV-${movimiento.id}`,
        },
      })
    }
  }

  return {
    movimientoId: movimiento.id,
    montoCaja,
    tipo: input.tipo,
    cantidad: input.cantidad,
    nombreEnvase: tipoEnvase.nombre,
  }
}

export async function saldoEnvasesCliente(empresaId: number, clienteId: number) {
  const db = prisma as typeof prisma & {
    movimientoEnvase: {
      groupBy: (args: object) => Promise<
        Array<{ tipoEnvaseId: number; tipo: string; _sum: { cantidad: number | null } }>
      >
    }
    tipoEnvase: { findMany: (args: object) => Promise<Array<{ id: number; nombre: string; valorDeposito: unknown }>> }
  }

  const grouped = await db.movimientoEnvase.groupBy({
    by: ["tipoEnvaseId", "tipo"],
    where: { empresaId, clienteId },
    _sum: { cantidad: true },
  })

  const saldoPorTipo = new Map<number, number>()
  for (const g of grouped) {
    const prev = saldoPorTipo.get(g.tipoEnvaseId) ?? 0
    const cant = g._sum.cantidad ?? 0
    if (g.tipo === "entrega") saldoPorTipo.set(g.tipoEnvaseId, prev + cant)
    else if (g.tipo === "retorno") saldoPorTipo.set(g.tipoEnvaseId, prev - cant)
  }

  const ids = [...saldoPorTipo.keys()].filter((id) => (saldoPorTipo.get(id) ?? 0) > 0)
  if (ids.length === 0) return []

  const tipos = await db.tipoEnvase.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, valorDeposito: true },
  })

  return tipos.map((t) => {
    const saldo = saldoPorTipo.get(t.id) ?? 0
    return {
      tipoEnvaseId: t.id,
      nombre: t.nombre,
      saldo,
      depositoPendiente: saldo * Number(t.valorDeposito),
    }
  })
}