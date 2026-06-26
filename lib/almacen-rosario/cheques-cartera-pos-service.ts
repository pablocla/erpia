/**
 * Alta simplificada de cheque de tercero desde retail.
 */
import { prisma } from "@/lib/prisma"
import { chequeEmpresaWhere } from "@/lib/auth/tenant-validate"

export async function registrarChequeCarteraPos(input: {
  empresaId: number
  numero: string
  monto: number
  fechaVencimiento: string
  bancoNombre?: string
  cuitLibrador?: string
  clienteId?: number
  observaciones?: string
}) {
  if (input.monto <= 0) throw new Error("Monto inválido")
  if (!input.numero.trim()) throw new Error("Número de cheque requerido")

  const venc = new Date(input.fechaVencimiento)
  if (Number.isNaN(venc.getTime())) throw new Error("Fecha de vencimiento inválida")

  if (input.clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: input.clienteId, empresaId: input.empresaId },
    })
    if (!cliente) throw new Error("Cliente no encontrado")
  }

  const cheque = await prisma.cheque.create({
    data: {
      numero: input.numero.trim(),
      monto: input.monto,
      fechaEmision: new Date(),
      fechaVencimiento: venc,
      bancoNombre: input.bancoNombre,
      cuitBancoLibrador: input.cuitLibrador,
      tipoCheque: "tercero",
      estado: "cartera",
      clienteId: input.clienteId,
      observaciones: input.observaciones ?? "Registro desde POS Almacén",
    },
  })

  return {
    id: cheque.id,
    numero: cheque.numero,
    monto: input.monto,
    estado: cheque.estado,
    fechaVencimiento: venc.toISOString().slice(0, 10),
  }
}

export async function listarChequesCarteraProximos(empresaId: number, dias = 14) {
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + dias)

  const rows = await prisma.cheque.findMany({
    where: {
      AND: [chequeEmpresaWhere(empresaId), { estado: "cartera", fechaVencimiento: { lte: hasta } }],
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 30,
  })

  return rows.map((c) => ({
    id: c.id,
    numero: c.numero,
    monto: Number(c.monto),
    fechaVencimiento: c.fechaVencimiento.toISOString().slice(0, 10),
    bancoNombre: c.bancoNombre,
  }))
}