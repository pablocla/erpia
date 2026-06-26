/**
 * Ticket regalo — canje en POS (extensión del flujo vale).
 */
import { prisma } from "@/lib/prisma"
import { buscarValeActivo, aplicarCobroVale, generarTextoTicketVale } from "./vale-dinero-service"

export async function siguienteNumeroRegalo(empresaId: number): Promise<string> {
  const db = prisma as typeof prisma & {
    valeDinero: { count: (args: object) => Promise<number> }
  }
  const total = await db.valeDinero.count({
    where: { empresaId, numero: { startsWith: "REGALO-" } },
  })
  return `REGALO-${String(total + 1).padStart(6, "0")}`
}

export async function emitirTicketRegalo(input: {
  empresaId: number
  monto: number
  titularNombre?: string
  facturaOrigenId?: number
  observaciones?: string
}) {
  if (input.monto <= 0) throw new Error("El monto debe ser mayor a cero")

  const db = prisma as typeof prisma & {
    valeDinero: {
      create: (args: object) => Promise<{
        numero: string
        montoOriginal: unknown
        saldoRestante: unknown
      }>
    }
  }

  const numero = await siguienteNumeroRegalo(input.empresaId)
  const vale = await db.valeDinero.create({
    data: {
      empresaId: input.empresaId,
      numero,
      montoOriginal: input.monto,
      saldoRestante: input.monto,
      titularNombre: input.titularNombre,
      observaciones: input.observaciones ?? (input.facturaOrigenId ? `Devolución FAC #${input.facturaOrigenId}` : "Ticket regalo"),
      estado: "activo",
    },
  })

  const ticket = generarTextoTicketVale({
    numero: vale.numero,
    montoOriginal: Number(vale.montoOriginal),
    titularNombre: input.titularNombre,
    fechaEmision: new Date().toISOString().slice(0, 10),
    observaciones: "Ticket regalo — canjeable en compras",
  }).replace("VALE DE DINERO", "TICKET REGALO")

  return {
    numero: vale.numero,
    montoOriginal: Number(vale.montoOriginal),
    saldoRestante: Number(vale.saldoRestante),
    ticket,
  }
}

export async function buscarTicketRegaloActivo(empresaId: number, numero: string) {
  const n = numero.trim().toUpperCase()
  if (!n.startsWith("REGALO-")) throw new Error("Número de ticket regalo inválido")
  return buscarValeActivo(empresaId, n)
}

export async function aplicarCobroTicketRegalo(
  input: Parameters<typeof aplicarCobroVale>[0],
) {
  if (!input.numero.toUpperCase().startsWith("REGALO-")) {
    throw new Error("Usá un ticket REGALO- para este medio")
  }
  return aplicarCobroVale(input)
}