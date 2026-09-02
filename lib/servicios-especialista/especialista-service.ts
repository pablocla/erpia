/**
 * Órdenes de packs de especialista: persistidas en el pipeline comercial
 * (tabla ya en producción) + checkout con el MP de plataforma de Claver.
 */

import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/config/public-app-url"
import { getMpAccessToken, isMpMockMode } from "@/lib/config/env"
import {
  createComercialLead,
  getComercialLeadById,
  updateComercialLead,
  type ComercialLeadRow,
} from "@/lib/ops/comercial-pipeline-service"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"
import { generarSlotsImplementacion, slotDisponible, type SlotImplementacion } from "@/lib/comercial/implementacion-arca"
import {
  ORIGEN_ESPECIALISTA,
  getPackEspecialista,
  packPublico,
  type PackEspecialista,
  type PackEspecialistaPublico,
} from "@/lib/servicios-especialista/especialista-catalog"

export type EstadoPagoEspecialista = "pendiente" | "pagado" | "cancelado"

export type EspecialistaMeta = {
  v: 1
  packId: string
  sku: string
  estadoPago: EstadoPagoEspecialista
  mpPreferenceId?: string
  mpInitPoint?: string
  mpPaymentId?: string
  mpSubscriptionId?: string
  telefono?: string
  slotIso?: string
  observaciones?: string
}

export type OrdenEspecialista = {
  id: number
  pack: PackEspecialistaPublico
  estadoPago: EstadoPagoEspecialista
  telefono: string | null
  slotIso: string | null
  slotLabel: string | null
  checkoutUrl: string | null
  mock: boolean
  createdAt: string
}

export type CheckoutEspecialistaResult = {
  orden: OrdenEspecialista
  checkoutUrl: string
  mock: boolean
}

function db() {
  return prisma as any
}

function encodeNotas(meta: EspecialistaMeta, human: string): string {
  return `[ESPECIALISTA]\n${JSON.stringify(meta)}\n${human}`
}

export function parseEspecialistaMeta(notas: string | null | undefined): EspecialistaMeta | null {
  if (!notas?.includes("[ESPECIALISTA]")) return null
  const line = notas.split("\n").find((l) => l.trim().startsWith("{"))
  if (!line) return null
  try {
    const parsed = JSON.parse(line) as EspecialistaMeta
    if (parsed?.v !== 1 || !parsed.packId) return null
    return parsed
  } catch {
    return null
  }
}

export function whatsappSoporteNumero(): string | null {
  const raw =
    process.env.CLAVER_WHATSAPP_SOPORTE ||
    process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE ||
    process.env.CLAVER_SOPORTE_WHATSAPP ||
    ""
  const n = raw.replace(/\D/g, "")
  return n.length >= 10 ? n : null
}

function slotLabelFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

function toOrden(lead: ComercialLeadRow, pack: PackEspecialista, mock: boolean): OrdenEspecialista {
  const meta = parseEspecialistaMeta(lead.notas)
  return {
    id: lead.id,
    pack: packPublico(pack),
    estadoPago: meta?.estadoPago ?? "pendiente",
    telefono: lead.telefono,
    slotIso: meta?.slotIso ?? lead.proximaFecha,
    slotLabel: slotLabelFromIso(meta?.slotIso ?? lead.proximaFecha),
    checkoutUrl: meta?.mpInitPoint ?? null,
    mock,
    createdAt: lead.createdAt,
  }
}

export async function findOrdenEspecialista(opts: {
  empresaId?: number | null
  email?: string | null
  leadId?: number | null
}): Promise<ComercialLeadRow | null> {
  try {
    if (opts.leadId && Number.isFinite(opts.leadId)) {
      const row = await getComercialLeadById(opts.leadId)
      if (row?.origen === ORIGEN_ESPECIALISTA) return row
    }

    const or: Record<string, unknown>[] = []
    if (opts.empresaId && Number.isFinite(opts.empresaId)) or.push({ empresaId: opts.empresaId })
    if (opts.email?.trim()) or.push({ email: opts.email.trim().toLowerCase() })
    if (or.length === 0) return null

    const row = await db().comercialPipelineLead.findFirst({
      where: {
        origen: ORIGEN_ESPECIALISTA,
        etapa: { in: ["prospecto", "visita", "trial"] },
        OR: or,
      },
      orderBy: { createdAt: "desc" },
    })
    if (!row) return null
    return {
      ...row,
      valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
      proximaFecha: row.proximaFecha ? new Date(row.proximaFecha).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    } as ComercialLeadRow
  } catch {
    return null
  }
}

async function crearPreferenciaPlataforma(input: {
  titulo: string
  monto: number
  email: string
  externalReference: string
  backUrl: string
}): Promise<{ id: string; initPoint: string; mock: boolean }> {
  const mock = isMpMockMode()
  if (mock) {
    return {
      id: `pref_mock_${Date.now()}`,
      initPoint: `${input.backUrl}${input.backUrl.includes("?") ? "&" : "?"}mp_mock=1&ref=${encodeURIComponent(input.externalReference)}`,
      mock: true,
    }
  }

  const token = getMpAccessToken()
  const baseUrl = getPublicAppUrl()
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.titulo,
          quantity: 1,
          unit_price: input.monto,
          currency_id: "ARS",
        },
      ],
      external_reference: input.externalReference,
      payer: { email: input.email },
      back_urls: {
        success: input.backUrl,
        failure: input.backUrl,
        pending: input.backUrl,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error MercadoPago: ${err}`)
  }

  const data = await response.json()
  const initPoint = data.init_point ?? data.sandbox_init_point
  if (!initPoint) throw new Error("MercadoPago no devolvió init_point")
  return { id: String(data.id), initPoint, mock: false }
}

export async function crearCheckoutEspecialista(input: {
  empresaId: number
  email: string
  nombre: string
  empresaNombre?: string | null
  packId: string
  telefono: string
  slotIso?: string
  observaciones?: string
}): Promise<CheckoutEspecialistaResult> {
  const pack = getPackEspecialista(input.packId)
  if (!pack) throw new Error("Pack no encontrado")

  const telefono = input.telefono.replace(/\D/g, "")
  if (telefono.length < 8) throw new Error("Ingresá un WhatsApp válido (mínimo 8 dígitos)")

  let slot: SlotImplementacion | null = null
  if (input.slotIso) {
    slot = slotDisponible(input.slotIso)
    if (!slot) throw new Error("Ese turno ya no está disponible. Elegí otro horario.")
  }

  const existente = await findOrdenEspecialista({
    empresaId: input.empresaId,
    email: input.email,
  })
  const metaExistente = existente ? parseEspecialistaMeta(existente.notas) : null
  if (existente && metaExistente?.estadoPago === "pagado" && metaExistente.packId === pack.id) {
    throw new Error("Este pack ya está pago. El especialista te contacta al WhatsApp que dejaste.")
  }

  const human = [
    `Pack: ${pack.nombre} ($${pack.precioARS.toLocaleString("es-AR")})`,
    slot ? `Turno pedido: ${slot.label}` : "Turno: a coordinar post-pago",
    `WhatsApp: ${telefono}`,
    input.observaciones?.trim() ? `Notas: ${input.observaciones.trim()}` : null,
    "No se agenda trabajo hasta acreditar el pago.",
  ]
    .filter(Boolean)
    .join("\n")

  const metaBase: EspecialistaMeta = {
    v: 1,
    packId: pack.id,
    sku: pack.sku,
    estadoPago: "pendiente",
    telefono,
    slotIso: slot?.iso,
    observaciones: input.observaciones?.trim() || undefined,
  }

  const payload = {
    nombre: input.nombre.trim(),
    email: input.email.trim().toLowerCase(),
    telefono,
    negocio: input.empresaNombre?.trim() || undefined,
    origen: ORIGEN_ESPECIALISTA,
    etapa: "visita" as const,
    valorEstimado: pack.precioARS,
    proximaAccion: `Cobrar pack ${pack.nombre}`,
    proximaFecha: slot?.iso,
    notas: encodeNotas(metaBase, human),
    empresaId: input.empresaId,
    rubro: pack.sku,
  }

  let lead: ComercialLeadRow
  if (existente && metaExistente?.estadoPago !== "pagado") {
    lead = (await updateComercialLead(existente.id, payload)) ?? existente
  } else {
    lead = await createComercialLead(payload, input.email)
  }

  const baseUrl = getPublicAppUrl()
  const backUrl = `${baseUrl}/dashboard/especialista?orden=${lead.id}`
  const externalRef = `especialista-${lead.id}`
  const mock = isMpMockMode()

  let checkoutUrl: string
  let meta: EspecialistaMeta = { ...metaBase }

  const pref = await crearPreferenciaPlataforma({
    titulo: pack.tipo === "recurrente" ? `Claver — ${pack.nombre} (1er mes)` : `Claver — ${pack.nombre}`,
    monto: pack.precioARS,
    email: input.email,
    externalReference: externalRef,
    backUrl,
  })
  checkoutUrl = pref.initPoint
  meta = {
    ...meta,
    mpPreferenceId: pref.id,
    mpInitPoint: checkoutUrl,
  }

  await updateComercialLead(lead.id, {
    notas: encodeNotas(meta, human),
    proximaAccion: `Pago pendiente: ${pack.nombre}`,
  })

  void notifyAnalistasFunnel("especialista_checkout", lead, { empresaId: input.empresaId })

  const orden = toOrden(
    {
      ...lead,
      notas: encodeNotas(meta, human),
      telefono,
    },
    pack,
    mock,
  )

  return {
    orden: { ...orden, checkoutUrl },
    checkoutUrl,
    mock,
  }
}

export async function marcarOrdenPagada(leadId: number, mpPaymentId?: string): Promise<OrdenEspecialista | null> {
  const lead = await findOrdenEspecialista({ leadId })
  if (!lead) return null
  const pack = getPackEspecialista(parseEspecialistaMeta(lead.notas)?.packId ?? "")
  if (!pack) return null

  const prev = parseEspecialistaMeta(lead.notas) ?? {
    v: 1 as const,
    packId: pack.id,
    sku: pack.sku,
    estadoPago: "pendiente" as const,
  }
  const meta: EspecialistaMeta = {
    ...prev,
    estadoPago: "pagado",
    mpPaymentId: mpPaymentId ?? prev.mpPaymentId,
  }
  const human = [
    `Pack: ${pack.nombre}`,
    "PAGO ACREDITADO.",
    "Implementador: coordinar turno en horario hábil.",
    meta.telefono ? `WhatsApp cliente: ${meta.telefono}` : null,
    meta.slotIso ? `Turno pedido: ${slotLabelFromIso(meta.slotIso)}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const updated = await updateComercialLead(lead.id, {
    etapa: "cerrado",
    proximaAccion: `Entregar ${pack.nombre}`,
    notas: encodeNotas(meta, human),
  })

  const row = updated ?? lead
  void notifyAnalistasFunnel("especialista_pagado", row, { empresaId: row.empresaId ?? undefined })
  return toOrden({ ...row, notas: encodeNotas(meta, human) }, pack, isMpMockMode())
}

export async function confirmarPagoEspecialistaDesdeMp(paymentId: string): Promise<boolean> {
  if (isMpMockMode()) return false
  const token = getMpAccessToken()
  if (!token) return false

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return false
  const payment = (await response.json()) as {
    status?: string
    external_reference?: string
  }
  if (payment.status !== "approved") return false
  const ref = payment.external_reference ?? ""
  if (!ref.startsWith("especialista-")) return false
  const leadId = Number(ref.slice("especialista-".length))
  if (!Number.isFinite(leadId)) return false
  const orden = await marcarOrdenPagada(leadId, paymentId)
  return Boolean(orden)
}

export async function listOrdenesEspecialista(empresaId: number): Promise<OrdenEspecialista[]> {
  try {
    const rows = await db().comercialPipelineLead.findMany({
      where: { origen: ORIGEN_ESPECIALISTA, empresaId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    const out: OrdenEspecialista[] = []
    for (const row of rows) {
      const meta = parseEspecialistaMeta(row.notas as string | null)
      const pack = getPackEspecialista(meta?.packId ?? (row.rubro as string))
      if (!pack) continue
      out.push(
        toOrden(
          {
            id: row.id,
            nombre: row.nombre,
            negocio: row.negocio,
            telefono: row.telefono,
            email: row.email,
            localidad: row.localidad,
            rubro: row.rubro,
            origen: row.origen,
            etapa: row.etapa,
            valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
            proximaAccion: row.proximaAccion,
            proximaFecha: row.proximaFecha ? new Date(row.proximaFecha).toISOString() : null,
            notas: row.notas,
            lat: row.lat,
            lon: row.lon,
            empresaId: row.empresaId,
            creadoPor: row.creadoPor,
            createdAt: new Date(row.createdAt).toISOString(),
            updatedAt: new Date(row.updatedAt).toISOString(),
          },
          pack,
          isMpMockMode(),
        ),
      )
    }
    return out
  } catch {
    return []
  }
}

export function slotsEspecialista(): SlotImplementacion[] {
  return generarSlotsImplementacion()
}

export function linkWhatsAppPostPago(orden: OrdenEspecialista): string | null {
  const n = whatsappSoporteNumero()
  if (!n) return null
  const msg = `Hola, pagué el pack *${orden.pack.nombre}* (orden #${orden.id}). WhatsApp de contacto ya está en el pedido.${orden.slotLabel ? ` Turno pedido: ${orden.slotLabel}.` : ""}`
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`
}
