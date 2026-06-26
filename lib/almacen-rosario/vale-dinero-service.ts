/**
 * Vale de dinero — ticket canjeable en POS (almacenes de barrio).
 */
import { prisma } from "@/lib/prisma"

type ValeDb = {
  valeDinero: {
    count: (args: object) => Promise<number>
    findFirst: (args: object) => Promise<{
      id: number
      numero: string
      saldoRestante: unknown
      montoOriginal: unknown
      estado: string
      titularNombre: string | null
      fechaVencimiento: Date | null
      clienteId: number | null
    } | null>
    create: (args: object) => Promise<{
      id: number
      numero: string
      montoOriginal: unknown
      saldoRestante: unknown
      estado: string
      fechaEmision: Date
      titularNombre: string | null
      fechaVencimiento: Date | null
    }>
    update: (args: object) => Promise<unknown>
    updateMany: (args: object) => Promise<{ count: number }>
    findMany: (args: object) => Promise<unknown[]>
  }
  cobroVale: { create: (args: object) => Promise<unknown> }
}

export interface EmitirValeInput {
  empresaId: number
  monto: number
  titularNombre?: string
  clienteId?: number
  observaciones?: string
  diasVencimiento?: number
}

export async function siguienteNumeroVale(empresaId: number): Promise<string> {
  const db = prisma as typeof prisma & {
    valeDinero: { count: (args: object) => Promise<number> }
  }
  const total = await db.valeDinero.count({ where: { empresaId } })
  return `VALE-${String(total + 1).padStart(6, "0")}`
}

export async function emitirVale(input: EmitirValeInput) {
  const db = prisma as typeof prisma & {
    valeDinero: {
      create: (args: object) => Promise<{
        id: number
        numero: string
        montoOriginal: unknown
        saldoRestante: unknown
        estado: string
      }>
    }
  }

  if (input.monto <= 0) throw new Error("El monto del vale debe ser mayor a cero")

  if (input.clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: input.clienteId, empresaId: input.empresaId },
    })
    if (!cliente) throw new Error("Cliente no encontrado")
  }

  const numero = await siguienteNumeroVale(input.empresaId)
  const vencimiento = input.diasVencimiento
    ? new Date(Date.now() + input.diasVencimiento * 86400000)
    : null

  const vale = await db.valeDinero.create({
    data: {
      empresaId: input.empresaId,
      numero,
      montoOriginal: input.monto,
      saldoRestante: input.monto,
      titularNombre: input.titularNombre,
      clienteId: input.clienteId,
      observaciones: input.observaciones,
      fechaVencimiento: vencimiento,
      estado: "activo",
    },
  })

  return {
    id: vale.id,
    numero: vale.numero,
    montoOriginal: Number(vale.montoOriginal),
    saldoRestante: Number(vale.saldoRestante),
    estado: vale.estado,
  }
}

export async function buscarValeActivo(
  empresaId: number,
  numero: string,
  db: ValeDb = prisma as unknown as ValeDb,
) {
  const vale = await db.valeDinero.findFirst({
    where: { empresaId, numero: numero.trim().toUpperCase() },
  })
  if (!vale) return null
  if (vale.estado === "anulado") throw new Error("Vale anulado")
  if (vale.estado === "cobrado" || Number(vale.saldoRestante) <= 0) {
    throw new Error("Vale ya cobrado en su totalidad")
  }
  if (vale.fechaVencimiento && vale.fechaVencimiento < new Date()) {
    throw new Error("Vale vencido")
  }
  return {
    ...vale,
    saldoRestante: Number(vale.saldoRestante),
    montoOriginal: Number(vale.montoOriginal),
  }
}

export async function aplicarCobroVale(
  input: {
    empresaId: number
    numero: string
    monto: number
    facturaId?: number
    referencia?: string
  },
  db: ValeDb = prisma as unknown as ValeDb,
) {
  const vale = await buscarValeActivo(input.empresaId, input.numero, db)
  if (!vale) throw new Error("Vale no encontrado")

  const saldo = vale.saldoRestante
  if (input.monto > saldo + 0.01) {
    throw new Error(`El vale solo tiene $${saldo.toLocaleString("es-AR")} disponibles`)
  }

  const nuevoSaldo = Math.round((saldo - input.monto) * 100) / 100
  const nuevoEstado = nuevoSaldo <= 0 ? "cobrado" : "activo"

  await db.cobroVale.create({
    data: {
      empresaId: input.empresaId,
      valeId: vale.id,
      monto: input.monto,
      facturaId: input.facturaId,
      referencia: input.referencia ?? input.numero,
    },
  })

  await db.valeDinero.update({
    where: { id: vale.id },
    data: { saldoRestante: Math.max(0, nuevoSaldo), estado: nuevoEstado },
  })

  return { numero: vale.numero, cobrado: input.monto, saldoRestante: Math.max(0, nuevoSaldo) }
}

export async function anularVale(empresaId: number, numero: string) {
  const db = prisma as typeof prisma & {
    valeDinero: { updateMany: (args: object) => Promise<{ count: number }> }
  }
  const r = await db.valeDinero.updateMany({
    where: { empresaId, numero: numero.trim().toUpperCase(), estado: "activo" },
    data: { estado: "anulado", saldoRestante: 0 },
  })
  if (r.count === 0) throw new Error("Vale no encontrado o ya utilizado")
  return { ok: true }
}

export async function listarValesActivos(empresaId: number, limite = 50) {
  const db = prisma as typeof prisma & {
    valeDinero: { findMany: (args: object) => Promise<unknown[]> }
  }
  const rows = (await db.valeDinero.findMany({
    where: { empresaId, estado: "activo", saldoRestante: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limite,
    include: { cliente: { select: { id: true, nombre: true } } },
  })) as Array<{
    id: number
    numero: string
    montoOriginal: unknown
    saldoRestante: unknown
    titularNombre: string | null
    fechaEmision: Date
    cliente: { nombre: string } | null
  }>

  return rows.map((v) => ({
    id: v.id,
    numero: v.numero,
    montoOriginal: Number(v.montoOriginal),
    saldoRestante: Number(v.saldoRestante),
    titularNombre: v.titularNombre ?? v.cliente?.nombre,
    fechaEmision: v.fechaEmision.toISOString().slice(0, 10),
  }))
}

export function generarTextoTicketVale(vale: {
  numero: string
  montoOriginal: number
  titularNombre?: string | null
  fechaEmision?: string
  fechaVencimiento?: string | null
  observaciones?: string | null
}) {
  const lines = [
    "================================",
    "       VALE DE DINERO",
    "================================",
    `Nº: ${vale.numero}`,
    vale.fechaEmision ? `Fecha: ${vale.fechaEmision}` : "",
    vale.titularNombre ? `Titular: ${vale.titularNombre}` : "",
    "",
    `MONTO: $${vale.montoOriginal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
    "",
    "Canjeable en compras del local.",
    vale.fechaVencimiento ? `Vence: ${vale.fechaVencimiento}` : "Sin vencimiento",
    vale.observaciones ? `Obs: ${vale.observaciones}` : "",
    "================================",
  ]
  return lines.filter(Boolean).join("\n")
}