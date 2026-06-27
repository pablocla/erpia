import { prisma } from "@/lib/prisma"
import { createComercialLead, updateComercialLead } from "@/lib/ops/comercial-pipeline-service"

function db() {
  return prisma as any
}

export type RelevamientoInput = {
  negocio: string
  nombreContacto?: string
  direccion?: string
  localidad?: string
  rubro?: string
  telefono?: string
  engancheCandidato?: string
  respFiado?: string
  respTiempoCobrar?: string
  respFacturaElectronica?: string
  respStockGondola?: string
  respQuienAtiende?: string
  dolorPrincipal?: string
  nivelInteres?: string
  objecionPrincipal?: string
  demoMostrada?: boolean
  trialOfrecido?: boolean
  trialAceptado?: boolean
  speechUsado?: string
  proximaAccion?: string
  proximaFecha?: string
  notas?: string
  fechaVisita?: string
  leadId?: number
  sincronizarPipeline?: boolean
}

export type RelevamientoRow = {
  id: number
  fechaVisita: string
  negocio: string
  nombreContacto: string | null
  direccion: string | null
  localidad: string | null
  rubro: string | null
  telefono: string | null
  engancheCandidato: string | null
  respFiado: string | null
  respTiempoCobrar: string | null
  respFacturaElectronica: string | null
  respStockGondola: string | null
  respQuienAtiende: string | null
  dolorPrincipal: string | null
  nivelInteres: string
  objecionPrincipal: string | null
  demoMostrada: boolean
  trialOfrecido: boolean
  trialAceptado: boolean
  speechUsado: string | null
  proximaAccion: string | null
  proximaFecha: string | null
  notas: string | null
  lat: number | null
  lon: number | null
  leadId: number | null
  creadoPor: string
  createdAt: string
}

function mapRow(row: Record<string, unknown>): RelevamientoRow {
  return {
    id: row.id as number,
    fechaVisita: new Date(row.fechaVisita as string).toISOString(),
    negocio: row.negocio as string,
    nombreContacto: (row.nombreContacto as string | null) ?? null,
    direccion: (row.direccion as string | null) ?? null,
    localidad: (row.localidad as string | null) ?? null,
    rubro: (row.rubro as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    engancheCandidato: (row.engancheCandidato as string | null) ?? null,
    respFiado: (row.respFiado as string | null) ?? null,
    respTiempoCobrar: (row.respTiempoCobrar as string | null) ?? null,
    respFacturaElectronica: (row.respFacturaElectronica as string | null) ?? null,
    respStockGondola: (row.respStockGondola as string | null) ?? null,
    respQuienAtiende: (row.respQuienAtiende as string | null) ?? null,
    dolorPrincipal: (row.dolorPrincipal as string | null) ?? null,
    nivelInteres: (row.nivelInteres as string) ?? "medio",
    objecionPrincipal: (row.objecionPrincipal as string | null) ?? null,
    demoMostrada: Boolean(row.demoMostrada),
    trialOfrecido: Boolean(row.trialOfrecido),
    trialAceptado: Boolean(row.trialAceptado),
    speechUsado: (row.speechUsado as string | null) ?? null,
    proximaAccion: (row.proximaAccion as string | null) ?? null,
    proximaFecha: row.proximaFecha ? new Date(row.proximaFecha as string).toISOString() : null,
    notas: (row.notas as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lon: (row.lon as number | null) ?? null,
    leadId: (row.leadId as number | null) ?? null,
    creadoPor: row.creadoPor as string,
    createdAt: new Date(row.createdAt as string).toISOString(),
  }
}

function buildNotasResumen(input: RelevamientoInput): string {
  const lineas = [
    input.dolorPrincipal && `Dolor: ${input.dolorPrincipal}`,
    input.engancheCandidato && `Enganche: ${input.engancheCandidato}`,
    input.demoMostrada && "Demo mostrada",
    input.trialOfrecido && (input.trialAceptado ? "Trial aceptado" : "Trial ofrecido"),
    input.notas,
  ].filter(Boolean)
  return lineas.join(" · ")
}

export async function listRelevamientos(limit = 50): Promise<RelevamientoRow[]> {
  const rows = await db().comercialRelevamientoVisita.findMany({
    orderBy: { fechaVisita: "desc" },
    take: limit,
  })
  return rows.map(mapRow)
}

export async function getRelevamiento(id: number): Promise<RelevamientoRow | null> {
  const row = await db().comercialRelevamientoVisita.findUnique({ where: { id } })
  return row ? mapRow(row) : null
}

export async function createRelevamiento(
  input: RelevamientoInput,
  creadoPor: string,
): Promise<{ relevamiento: RelevamientoRow; leadId: number | null }> {
  let leadId = input.leadId ?? null

  if (input.sincronizarPipeline !== false) {
    const etapa = input.trialAceptado ? "trial" : "visita"
    const nombre = input.nombreContacto?.trim() || input.negocio.trim()
    const notas = buildNotasResumen(input)

    if (leadId) {
      await updateComercialLead(leadId, {
        nombre,
        negocio: input.negocio,
        telefono: input.telefono,
        localidad: input.localidad,
        rubro: input.rubro,
        etapa,
        proximaAccion: input.proximaAccion,
        proximaFecha: input.proximaFecha,
        notas,
      })
    } else {
      const lead = await createComercialLead(
        {
          nombre,
          negocio: input.negocio,
          telefono: input.telefono,
          localidad: input.localidad,
          rubro: input.rubro,
          etapa,
          proximaAccion: input.proximaAccion,
          proximaFecha: input.proximaFecha,
          notas,
          origen: "calle",
        },
        creadoPor,
      )
      leadId = lead.id
    }
  }

  const row = await db().comercialRelevamientoVisita.create({
    data: {
      fechaVisita: input.fechaVisita ? new Date(input.fechaVisita) : new Date(),
      negocio: input.negocio.trim(),
      nombreContacto: input.nombreContacto?.trim() || null,
      direccion: input.direccion?.trim() || null,
      localidad: input.localidad?.trim() || null,
      rubro: input.rubro || null,
      telefono: input.telefono?.trim() || null,
      engancheCandidato: input.engancheCandidato || null,
      respFiado: input.respFiado?.trim() || null,
      respTiempoCobrar: input.respTiempoCobrar?.trim() || null,
      respFacturaElectronica: input.respFacturaElectronica?.trim() || null,
      respStockGondola: input.respStockGondola?.trim() || null,
      respQuienAtiende: input.respQuienAtiende?.trim() || null,
      dolorPrincipal: input.dolorPrincipal || null,
      nivelInteres: input.nivelInteres || "medio",
      objecionPrincipal: input.objecionPrincipal || null,
      demoMostrada: input.demoMostrada ?? false,
      trialOfrecido: input.trialOfrecido ?? false,
      trialAceptado: input.trialAceptado ?? false,
      speechUsado: input.speechUsado?.trim() || null,
      proximaAccion: input.proximaAccion?.trim() || null,
      proximaFecha: input.proximaFecha ? new Date(input.proximaFecha) : null,
      notas: input.notas?.trim() || null,
      leadId,
      creadoPor: creadoPor.trim().toLowerCase(),
    },
  })

  return { relevamiento: mapRow(row), leadId }
}

export async function countRelevamientosSemana(): Promise<number> {
  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return db().comercialRelevamientoVisita.count({
    where: { fechaVisita: { gte: desde } },
  })
}