/**
 * Packs autorizados a go-live PRD — espejo de docs/GO_LIVE_PRD.md §3.1
 * Fuente de verdad en código para comercial y Cloud.
 */

export type GoLiveTier = "prd" | "piloto" | "demo" | "no_vender"

export interface GoLivePackDef {
  id: string
  label: string
  tier: GoLiveTier
  /** industryId del sensor /demo */
  industryIds?: string[]
  /** engancheId / SKU de entrada */
  enganches?: string[]
  goldenPath: string
  promesaOk: string
  promesaNo: string
}

/** Solo estos se cierran como producto PRD (con implementador). */
export const GO_LIVE_PACKS_PRD: GoLivePackDef[] = [
  {
    id: "fiado_kiosco",
    label: "Libreta Fiado + kiosco/almacén",
    tier: "prd",
    industryIds: ["almacen", "kiosco"],
    enganches: ["pos.fiado_barrio", "pool-kiosco-barrio", "pool-almacen-barrio"],
    goldenPath: "/dashboard/fiado",
    promesaOk: "Fiado, caja, stock, clientes",
    promesaNo: "Offline infalible; WA sin Twilio",
  },
  {
    id: "pos_core",
    label: "POS + factura mostrador",
    tier: "prd",
    enganches: ["pos.core", "core.claver"],
    goldenPath: "/dashboard/pos",
    promesaOk: "Ticket/factura según AFIP del tenant",
    promesaNo: "AFIP self-serve mágico sin cert",
  },
  {
    id: "ferreteria_mostrador",
    label: "Ferretería mostrador",
    tier: "prd",
    industryIds: ["ferreteria"],
    enganches: ["pos.core"],
    goldenPath: "/dashboard/ventas",
    promesaOk: "Stock, venta, CC simple",
    promesaNo: "Corte m² / obra full",
  },
  {
    id: "cobranza_wa",
    label: "Cobranza WhatsApp",
    tier: "prd",
    enganches: ["intang.cobranzas_wa"],
    goldenPath: "/dashboard/cuentas-cobrar",
    promesaOk: "Recordatorios si Twilio configurado",
    promesaNo: "Cobranza judicial",
  },
  {
    id: "monotributo",
    label: "Monotributo / freelance",
    tier: "prd",
    industryIds: ["freelance_mt"],
    enganches: ["pool-monotributo"],
    goldenPath: "/dashboard/ventas/presupuestos",
    promesaOk: "Presupuesto + cobro + factura C",
    promesaNo: "Estudio contable completo",
  },
  {
    id: "servicios_pro",
    label: "Servicios pro liviano",
    tier: "prd",
    industryIds: ["servicios_pro"],
    enganches: ["pool-servicios-pro"],
    goldenPath: "/dashboard/agenda",
    promesaOk: "Agenda + presupuestos + CxC",
    promesaNo: "OT field / contratos de mant.",
  },
  {
    id: "gimnasio",
    label: "Gym / membresías",
    tier: "prd",
    industryIds: ["gimnasio", "gimnasio_barrio"],
    enganches: ["niche.gimnasio_barrio"],
    goldenPath: "/dashboard/membresias",
    promesaOk: "Socios, planes, morosos, cobro manual",
    promesaNo: "Torniquete, débito CBU socio",
  },
  {
    id: "club_barrio",
    label: "Club de barrio",
    tier: "prd",
    industryIds: ["club_barrio"],
    enganches: ["niche.club_barrio"],
    goldenPath: "/dashboard/nicho/club",
    promesaOk: "Socios, cuotas, cantina básica",
    promesaNo: "Federación / fixture pro",
  },
]

export const GO_LIVE_PACKS_PILOTO: GoLivePackDef[] = [
  {
    id: "veterinaria",
    label: "Veterinaria",
    tier: "piloto",
    industryIds: ["veterinaria", "vet_barrio"],
    goldenPath: "/dashboard/historia-clinica",
    promesaOk: "Fichas, consultas, mostrador, agenda",
    promesaNo: "HIS / lab / portal tutor full",
  },
  {
    id: "clinica",
    label: "Clínica / consultorio",
    tier: "piloto",
    industryIds: ["clinica", "consultorio_solo"],
    goldenPath: "/dashboard/agenda",
    promesaOk: "Turnos particular + factura simple",
    promesaNo: "Obra social / nomenclador full",
  },
  {
    id: "taller",
    label: "Taller mecánico",
    tier: "piloto",
    industryIds: ["taller_mecanico"],
    enganches: ["niche.taller_mecanico"],
    goldenPath: "/dashboard/nicho/taller",
    promesaOk: "Órdenes simples + stock básico",
    promesaNo: "Taller industrial / seguros",
  },
  {
    id: "fumigacion",
    label: "Fumigación / plagas",
    tier: "piloto",
    industryIds: ["fumigacion"],
    enganches: ["niche.fumigacion"],
    goldenPath: "/dashboard/fumigacion",
    promesaOk: "Ruta del día (mapa OSM), órdenes de visita, clientes, facturación y abonos",
    promesaNo: "MSDS/SENASA full, optimización TSP de ruta, app offline de campo",
  },
]

export const GO_LIVE_NO_VENDER = [
  "aire_acondicionado",
  "electricista_field",
  "piletero",
  "jardineria",
] as const

export function resolveGoLiveTier(opts: {
  industryId?: string | null
  engancheId?: string | null
}): GoLiveTier {
  const industry = opts.industryId?.trim()
  const eng = opts.engancheId?.trim()

  for (const p of GO_LIVE_PACKS_PRD) {
    if (industry && p.industryIds?.includes(industry)) return "prd"
    if (eng && p.enganches?.some((e) => e === eng || eng.startsWith(e))) return "prd"
  }
  for (const p of GO_LIVE_PACKS_PILOTO) {
    if (industry && p.industryIds?.includes(industry)) return "piloto"
    if (eng && p.enganches?.some((e) => e === eng)) return "piloto"
  }
  if (industry && (GO_LIVE_NO_VENDER as readonly string[]).includes(industry)) {
    return "no_vender"
  }
  return "demo"
}

export function isEnganchePrd(engancheId: string): boolean {
  return resolveGoLiveTier({ engancheId }) === "prd"
}
