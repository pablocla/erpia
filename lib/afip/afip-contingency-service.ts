/**
 * Contingencia fiscal AFIP — comprobantes provisorios cuando WSFE no responde.
 *
 * Flujo real del ERP:
 * 1. La venta se persiste como Factura con estado `pendiente_cae`
 * 2. Se intenta CAE síncrono (solicitarCaeFactura)
 * 3. Si falla por red/5xx → se encola reintento (BullMQ o in-process)
 * 4. Cron `/api/cron/sync-afip` y `syncFacturasPendientes` cubren el batch
 *
 * CAEA (RG 5782) es el camino oficial offline; este servicio cubre el ticket
 * provisorio interno mientras se reintenta CAE online.
 */

import { prisma } from "@/lib/prisma"
import { isAfipNetworkError } from "@/lib/afip/caea-config"
import { solicitarCaeFactura, type SolicitarCaeResult } from "@/lib/afip/solicitar-cae-factura"
import { enqueueAfipRetry } from "@/lib/afip/afip-retry-queue"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

export type ContingencyStatus = "PENDIENTE_CAE" | "CAE_APROBADO" | "ERROR_AFIP"

export interface ContingencyResult {
  facturaId: number
  estado: ContingencyStatus
  cae?: string
  vencimientoCae?: string
  contingencyCode?: string
  enqueued?: boolean
  queueMode?: "bullmq" | "inprocess"
  error?: string
}

export function generateContingencyTicketNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const randomHex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0")
    .toUpperCase()
  return `CONT-${dateStr}-${randomHex}`
}

/**
 * Tras crear la factura local, intenta CAE; si AFIP cae, deja pendiente y encola.
 */
export async function intentarCaeConContingencia(
  facturaId: number,
  empresaId: number,
): Promise<ContingencyResult> {
  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, empresaId },
    select: { id: true, estado: true, cae: true, vencimientoCAE: true, numero: true, tipo: true },
  })

  if (!factura) {
    return { facturaId, estado: "ERROR_AFIP", error: "Factura no encontrada" }
  }

  if (factura.cae) {
    return {
      facturaId,
      estado: "CAE_APROBADO",
      cae: factura.cae,
      vencimientoCae: factura.vencimientoCAE?.toISOString(),
    }
  }

  let afip: SolicitarCaeResult
  try {
    afip = await solicitarCaeFactura(facturaId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error AFIP"
    return markPendingAndEnqueue(facturaId, empresaId, msg, isAfipNetworkError(e))
  }

  if (afip.ok && afip.cae) {
    return {
      facturaId,
      estado: "CAE_APROBADO",
      cae: afip.cae,
      vencimientoCae: afip.vencimientoCAE,
    }
  }

  const errMsg = afip.error ?? "AFIP no devolvió CAE"
  const shouldRetry =
    /timeout|ECONN|5\d\d|unavailable|indisponib|temporar/i.test(errMsg) ||
    errMsg.toLowerCase().includes("red")

  return markPendingAndEnqueue(facturaId, empresaId, errMsg, shouldRetry)
}

async function markPendingAndEnqueue(
  facturaId: number,
  empresaId: number,
  error: string,
  enqueue: boolean,
): Promise<ContingencyResult> {
  const contingencyCode = generateContingencyTicketNumber()

  await prisma.factura.update({
    where: { id: facturaId },
    data: {
      estado: "pendiente_cae",
      observaciones: `Contingencia ${contingencyCode}: ${error}`.slice(0, 500),
    },
  })

  let queueMode: "bullmq" | "inprocess" | undefined
  let enqueued = false

  if (enqueue) {
    const q = await enqueueAfipRetry({ facturaId, empresaId })
    enqueued = q.queued
    queueMode = q.mode
  }

  try {
    await persistSistemaLog({
      empresaId,
      severidad: "warn",
      categoria: "afip",
      contexto: "contingencia:cae",
      mensaje: `Factura ${facturaId} en contingencia (${contingencyCode})`,
      metadata: { facturaId, error, enqueued, queueMode },
    })
  } catch {
    /* no bloquear venta */
  }

  return {
    facturaId,
    estado: "PENDIENTE_CAE",
    contingencyCode,
    enqueued,
    queueMode,
    error,
  }
}

/** @deprecated Usar intentarCaeConContingencia + Factura real en Prisma */
export interface ContingencyInvoice {
  id: string
  empresaId: string
  clienteId?: string
  tipoComprobante: string
  total: number
  items: Array<{ id: string; descripcion: string; cantidad: number; precioUnitario: number }>
  createdAt: Date
  contingencyCode: string
  status: "PENDIENTE_CAE" | "PROCESADO_AFIP" | "ERROR_AFIP"
}

export function createContingencyInvoicePayload(
  data: Omit<ContingencyInvoice, "id" | "createdAt" | "contingencyCode" | "status">,
): ContingencyInvoice {
  return {
    ...data,
    id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contingencyCode: generateContingencyTicketNumber(),
    createdAt: new Date(),
    status: "PENDIENTE_CAE",
  }
}
