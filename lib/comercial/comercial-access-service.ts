/**
 * Estado de acceso comercial — trial por SKU, ancla gratis y upsell.
 */

import { prisma } from "@/lib/prisma"
import { getTrialStatus, type TrialStatus } from "@/lib/comercial/trial-service"
import {
  getOfertaEmpresa,
  nombreLegibleSku,
  precioOfertaMonetizada,
  resolvePrecioSku,
  skuEsAnclaGratis,
  type OfertaComercial,
} from "@/lib/comercial/ofertas-comerciales"
import { getSubSaasApp } from "@/lib/comercial/sub-saas-catalog"

export interface MonetizadoEstado {
  sku: string
  nombre: string
  precioArs: number
  enTrial: boolean
  expirado: boolean
  gratisPermanente: boolean
}

export interface UpsellItem {
  sku: string
  nombre: string
  precioArs: number
}

export interface ComercialAccessState {
  trial: TrialStatus | null
  ofertaId: string | null
  ofertaNombre: string | null
  ofertaLema: string | null
  tieneAnclaGratis: boolean
  anclaSkus: string[]
  monetizados: MonetizadoEstado[]
  upsellSkus: UpsellItem[]
  precioUpgradeArs: number
  bloqueoTotal: boolean
  bloqueoEscrituraGlobal: boolean
  mpAutorizado: boolean
  modoLite: string | null
}

async function empresaBilling(empresaId: number) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { mpSubscriptionStatus: true, modoLite: true },
  })
}

function upsellDesdeModoLite(modoLite: string | null | undefined): UpsellItem[] {
  const slugByModo: Record<string, string> = {
    fiado: "fiado",
    cobranza: "cobra",
    pos: "tienda",
    niche: "turnos",
  }
  const slug = slugByModo[modoLite ?? ""] ?? "fiado"
  const app = getSubSaasApp(slug)
  if (!app?.upsellSkus?.length) return []

  return app.upsellSkus
    .map((sku) => ({
      sku,
      nombre: nombreLegibleSku(sku),
      precioArs: resolvePrecioSku(sku),
    }))
    .filter((u) => u.precioArs > 0)
}

export async function getSuscripcionesActivas(empresaId: number) {
  const now = new Date()
  return prisma.suscripcionModulo.findMany({
    where: {
      empresaId,
      activo: true,
      vigenciaDesde: { lte: now },
      OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: now } }],
    },
    select: { sku: true, vigenciaHasta: true },
  })
}

async function getSuscripcionesRegistradas(empresaId: number) {
  return prisma.suscripcionModulo.findMany({
    where: { empresaId, activo: true },
    select: { sku: true, vigenciaHasta: true },
  })
}

function evaluarMonetizado(
  sku: string,
  sub: { vigenciaHasta: Date | null } | undefined,
  oferta: OfertaComercial,
  trial: TrialStatus | null,
  mpAutorizado: boolean,
): MonetizadoEstado {
  const esAncla = skuEsAnclaGratis(oferta, sku)
  const vigenciaHasta = sub?.vigenciaHasta ?? null
  const now = Date.now()

  const gratisPermanente = esAncla && sub != null && vigenciaHasta === null

  if (mpAutorizado) {
    return {
      sku,
      nombre: nombreLegibleSku(sku),
      precioArs: resolvePrecioSku(sku),
      enTrial: false,
      expirado: false,
      gratisPermanente: esAncla,
    }
  }

  let expirado = false
  if (gratisPermanente) {
    expirado = false
  } else if (sub && vigenciaHasta != null) {
    expirado = vigenciaHasta.getTime() < now
  } else if (oferta.monetizar.includes(sku) || oferta.trialScope === "todo") {
    expirado = Boolean(trial?.expirado)
  }

  const enTrial = !gratisPermanente && !expirado && Boolean(sub ?? trial?.activo)

  return {
    sku,
    nombre: nombreLegibleSku(sku),
    precioArs: resolvePrecioSku(sku),
    enTrial,
    expirado,
    gratisPermanente,
  }
}

export async function getComercialAccessState(empresaId: number): Promise<ComercialAccessState> {
  const [empresa, trial, oferta, subs, subsRegistradas] = await Promise.all([
    empresaBilling(empresaId),
    getTrialStatus(empresaId),
    getOfertaEmpresa(empresaId),
    getSuscripcionesActivas(empresaId),
    getSuscripcionesRegistradas(empresaId),
  ])

  const mpAutorizado = empresa?.mpSubscriptionStatus === "authorized"
  const anclaSkus = oferta.anclaGratis.filter((sku) =>
    subs.some((s) => s.sku === sku && s.vigenciaHasta === null),
  )
  const tieneAnclaGratis = anclaSkus.length > 0

  const skusRelevantes = new Set([
    ...oferta.anclaGratis,
    ...oferta.monetizar,
    ...subsRegistradas.map((s) => s.sku),
  ])

  const monetizados: MonetizadoEstado[] = [...skusRelevantes].map((sku) => {
    const sub = subsRegistradas.find((s) => s.sku === sku)
    return evaluarMonetizado(sku, sub, oferta, trial, mpAutorizado)
  })

  const monetizadosExpirados = monetizados.filter((m) => m.expirado && !m.gratisPermanente)
  const upsellCatalogo = upsellDesdeModoLite(empresa?.modoLite)
  const upsellSkus = upsellCatalogo.filter(
    (u) => !subs.some((s) => s.sku === u.sku && (s.vigenciaHasta === null || s.vigenciaHasta >= new Date())),
  )

  const bloqueoTotal =
    empresa?.modoLite !== "protheus" &&
    !mpAutorizado &&
    !tieneAnclaGratis &&
    Boolean(trial?.expirado) &&
    monetizadosExpirados.length > 0

  const bloqueoEscrituraGlobal = bloqueoTotal

  return {
    trial,
    ofertaId: oferta.id,
    ofertaNombre: oferta.nombre,
    ofertaLema: oferta.lema,
    tieneAnclaGratis,
    anclaSkus,
    monetizados,
    upsellSkus,
    precioUpgradeArs: precioOfertaMonetizada(oferta),
    bloqueoTotal,
    bloqueoEscrituraGlobal,
    mpAutorizado,
    modoLite: empresa?.modoLite ?? null,
  }
}

export async function isEmpresaWriteBlocked(empresaId: number): Promise<boolean> {
  const state = await getComercialAccessState(empresaId)
  return state.bloqueoEscrituraGlobal
}

export async function canWriteSku(empresaId: number, sku: string): Promise<boolean> {
  const state = await getComercialAccessState(empresaId)
  if (state.mpAutorizado) return true

  const item = state.monetizados.find((m) => m.sku === sku)
  if (!item) return !state.bloqueoEscrituraGlobal
  if (item.gratisPermanente) return true
  return !item.expirado
}

export async function canWriteAnySku(
  empresaId: number,
  skus: string[],
  mode: "any" | "all" = "any",
): Promise<boolean> {
  if (mode === "all") {
    for (const sku of skus) {
      if (!(await canWriteSku(empresaId, sku))) return false
    }
    return true
  }
  for (const sku of skus) {
    if (await canWriteSku(empresaId, sku)) return true
  }
  return false
}