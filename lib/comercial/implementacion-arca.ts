/**
 * Pactar implementación ARCA (certificado de factura electrónica) + WhatsApp.
 * El comerciante elige un turno (tipo Calendly). Llega a Claver Cloud
 * como pendiente de upgrade. Mientras tanto puede vender con ticket interno, sin CAE.
 */

import { prisma } from "@/lib/prisma"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"
import {
  createComercialLead,
  updateComercialLead,
  type ComercialLeadRow,
} from "@/lib/ops/comercial-pipeline-service"

export const UPGRADE_ARCA_ORIGEN = "upgrade-arca-wsp"
export const UPGRADE_ARCA_HORAS = ["10:00", "15:00"] as const
export const UPGRADE_ARCA_TZ = "America/Argentina/Buenos_Aires"
/** ART no tiene DST. ISO con offset fijo para no depender del TZ del server. */
const ART_OFFSET = "-03:00"

export type SlotImplementacion = {
  id: string
  iso: string
  fecha: string
  hora: (typeof UPGRADE_ARCA_HORAS)[number]
  label: string
}

export type PactarImplementacionInput = {
  slotIso: string
  incluyeArca?: boolean
  incluyeWhatsapp?: boolean
  nombreAccesoArca?: string
  nombre?: string
  email?: string
  telefono?: string
  negocio?: string
  pagina?: string
  /** Honeypot — debe venir vacío */
  website?: string
}

export type PactarImplementacionAuth = {
  email: string
  nombre: string
  empresaId: number
  empresaNombre?: string | null
  telefono?: string | null
}

function db() {
  return prisma as any
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** Fecha civil en Argentina a partir de un Instant. */
export function fechaCivilArgentina(now: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: UPGRADE_ARCA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const y = Number(parts.find((p) => p.type === "year")?.value)
  const m = Number(parts.find((p) => p.type === "month")?.value)
  const d = Number(parts.find((p) => p.type === "day")?.value)
  return { y, m, d }
}

function addDaysCivil(y: number, m: number, d: number, days: number): { y: number; m: number; d: number } {
  const utc = Date.UTC(y, m - 1, d + days)
  const dt = new Date(utc)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

function isoSlot(y: number, m: number, d: number, hora: string): string {
  return `${y}-${pad(m)}-${pad(d)}T${hora}:00${ART_OFFSET}`
}

function weekdayUtcFromIso(iso: string): number {
  return new Date(iso).getUTCDay()
}

function labelSlot(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: UPGRADE_ARCA_TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

/**
 * Próximos turnos hábiles (lun–vie) a las 10:00 y 15:00 ART.
 * Descarta horarios con menos de 2 h de anticipación.
 */
export function generarSlotsImplementacion(now = new Date(), diasHabiles = 8): SlotImplementacion[] {
  const minMs = now.getTime() + 2 * 60 * 60 * 1000
  const civil = fechaCivilArgentina(now)
  const slots: SlotImplementacion[] = []
  let offset = 0
  let habiles = 0

  while (habiles < diasHabiles && offset < 21) {
    const day = addDaysCivil(civil.y, civil.m, civil.d, offset)
    offset += 1
    const probe = isoSlot(day.y, day.m, day.d, "12:00")
    const dow = weekdayUtcFromIso(probe)
    if (dow === 0 || dow === 6) continue
    habiles += 1

    for (const hora of UPGRADE_ARCA_HORAS) {
      const iso = isoSlot(day.y, day.m, day.d, hora)
      if (new Date(iso).getTime() < minMs) continue
      slots.push({
        id: iso,
        iso,
        fecha: `${day.y}-${pad(day.m)}-${pad(day.d)}`,
        hora,
        label: labelSlot(iso),
      })
    }
  }
  return slots
}

export function slotDisponible(slotIso: string, now = new Date()): SlotImplementacion | null {
  return generarSlotsImplementacion(now).find((s) => s.iso === slotIso) ?? null
}

function mapRow(row: Record<string, unknown>): ComercialLeadRow {
  return {
    id: row.id as number,
    nombre: row.nombre as string,
    negocio: (row.negocio as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    localidad: (row.localidad as string | null) ?? null,
    rubro: (row.rubro as string | null) ?? null,
    origen: row.origen as string,
    etapa: row.etapa as ComercialLeadRow["etapa"],
    valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
    proximaAccion: (row.proximaAccion as string | null) ?? null,
    proximaFecha: row.proximaFecha ? new Date(row.proximaFecha as string).toISOString() : null,
    notas: (row.notas as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lon: (row.lon as number | null) ?? null,
    empresaId: (row.empresaId as number | null) ?? null,
    creadoPor: row.creadoPor as string,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  }
}

export async function findPendingUpgradeArca(opts: {
  empresaId?: number | null
  email?: string | null
}): Promise<ComercialLeadRow | null> {
  const or: Record<string, unknown>[] = []
  if (opts.empresaId && Number.isFinite(opts.empresaId)) {
    or.push({ empresaId: opts.empresaId })
  }
  if (opts.email?.trim()) {
    or.push({ email: opts.email.trim().toLowerCase() })
  }
  if (or.length === 0) return null

  try {
    const row = await db().comercialPipelineLead.findFirst({
      where: {
        origen: UPGRADE_ARCA_ORIGEN,
        etapa: { in: ["prospecto", "visita"] },
        OR: or,
      },
      orderBy: { createdAt: "desc" },
    })
    return row ? mapRow(row) : null
  } catch {
    return null
  }
}

function buildNotas(input: PactarImplementacionInput, slot: SlotImplementacion): string {
  const arca = input.incluyeArca !== false
  const wsp = input.incluyeWhatsapp !== false
  const partes = [
    "[UPGRADE-ARCA][pendiente]",
    `Turno: ${slot.label} (${slot.iso})`,
    arca ? "Quiere certificado ARCA / factura electrónica." : null,
    wsp ? "Quiere WhatsApp de cobro." : null,
    input.nombreAccesoArca?.trim()
      ? `Quien tiene acceso a ARCA: ${input.nombreAccesoArca.trim()}`
      : "Quien tiene acceso a ARCA: (el contacto del turno)",
    "Mientras tanto vende con ticket interno, sin CAE.",
    input.pagina ? `Página: ${input.pagina}` : null,
  ].filter(Boolean)
  return partes.join("\n")
}

function proximaAccion(input: PactarImplementacionInput): string {
  const bits = [
    input.incluyeArca !== false ? "certificado ARCA" : null,
    input.incluyeWhatsapp !== false ? "WhatsApp" : null,
  ].filter(Boolean)
  return `Upgrade pendiente: ${bits.join(" + ")}`
}

export async function pactarImplementacionArca(
  input: PactarImplementacionInput,
  auth?: PactarImplementacionAuth | null,
  now = new Date(),
): Promise<{ lead: ComercialLeadRow; slot: SlotImplementacion; creado: boolean }> {
  if (input.website?.trim()) {
    throw new Error("Solicitud rechazada")
  }

  const slot = slotDisponible(input.slotIso, now)
  if (!slot) {
    throw new Error("Ese turno ya no está disponible. Elegí otro horario.")
  }

  const nombre = (auth?.nombre || input.nombre || "").trim()
  const email = (auth?.email || input.email || "").trim().toLowerCase()
  if (!nombre || !email) {
    throw new Error("Nombre y email son obligatorios para pactar el turno")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido")
  }

  const telefono = (input.telefono || auth?.telefono || "").trim() || undefined
  const negocio = (input.negocio || auth?.empresaNombre || "").trim() || undefined
  const incluyeArca = input.incluyeArca !== false
  const incluyeWhatsapp = input.incluyeWhatsapp !== false
  if (!incluyeArca && !incluyeWhatsapp) {
    throw new Error("Elegí al menos ARCA o WhatsApp")
  }

  const existente = await findPendingUpgradeArca({
    empresaId: auth?.empresaId,
    email,
  })

  const payload = {
    nombre,
    email,
    telefono,
    negocio,
    origen: UPGRADE_ARCA_ORIGEN,
    etapa: "visita" as const,
    proximaAccion: proximaAccion(input),
    proximaFecha: slot.iso,
    notas: buildNotas(input, slot),
    empresaId: auth?.empresaId,
    rubro: incluyeArca && incluyeWhatsapp ? "arca+whatsapp" : incluyeArca ? "arca" : "whatsapp",
  }

  let lead: ComercialLeadRow
  let creado = false
  if (existente) {
    const updated = await updateComercialLead(existente.id, payload)
    lead = updated ?? existente
  } else {
    lead = await createComercialLead(payload, email)
    creado = true
  }

  void notifyAnalistasFunnel("upgrade_arca_certificado", lead, {
    empresaId: auth?.empresaId,
  })

  return { lead, slot, creado }
}

export type UpgradeArcaPendiente = ComercialLeadRow & {
  empresaNombre: string | null
}

export async function listPendientesUpgradeArca(): Promise<UpgradeArcaPendiente[]> {
  try {
    const rows = await db().comercialPipelineLead.findMany({
      where: {
        origen: UPGRADE_ARCA_ORIGEN,
        etapa: { in: ["prospecto", "visita"] },
      },
      orderBy: [{ proximaFecha: "asc" }, { createdAt: "desc" }],
      take: 100,
    })
    const leads = rows.map(mapRow)
    const empresaIds = [...new Set(leads.map((l: UpgradeArcaPendiente) => l.empresaId).filter((id: number | null): id is number => Boolean(id)))]
    let nombres = new Map<number, string>()
    if (empresaIds.length > 0) {
      const empresas = await db().empresa.findMany({
        where: { id: { in: empresaIds } },
        select: { id: true, nombre: true },
      })
      nombres = new Map(
        (empresas as { id: number; nombre: string }[]).map((e) => [e.id, e.nombre]),
      )
    }
    return leads.map((l: UpgradeArcaPendiente) => ({
      ...l,
      empresaNombre: l.empresaId ? nombres.get(l.empresaId) ?? null : null,
    }))
  } catch {
    return []
  }
}

export async function countPendientesUpgradeArca(): Promise<number> {
  try {
    return await db().comercialPipelineLead.count({
      where: {
        origen: UPGRADE_ARCA_ORIGEN,
        etapa: { in: ["prospecto", "visita"] },
      },
    })
  } catch {
    return 0
  }
}

export async function resolverUpgradeArca(
  id: number,
  accion: "atender" | "descartar",
): Promise<ComercialLeadRow | null> {
  const row = await db().comercialPipelineLead.findUnique({ where: { id } })
  if (!row || row.origen !== UPGRADE_ARCA_ORIGEN) return null

  const notasPrevias = typeof row.notas === "string" ? row.notas : ""
  const marca = accion === "atender" ? "[UPGRADE-ARCA][atendido]" : "[UPGRADE-ARCA][descartado]"
  const notas = notasPrevias.replace("[UPGRADE-ARCA][pendiente]", marca)

  return updateComercialLead(id, {
    etapa: accion === "atender" ? "cerrado" : "descartado",
    proximaAccion:
      accion === "atender"
        ? "Certificado ARCA / WhatsApp en implementación"
        : "Upgrade ARCA descartado",
    notas,
  })
}
