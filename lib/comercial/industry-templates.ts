// @ts-nocheck
/**
 * Catálogo unificado de industrias — Sensor Comercial Claver
 * Fuente de verdad: demo, provisioning, labels de sidebar y golden action.
 */

import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import { getRubroUx, normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"
import { engancheParaRubro } from "@/lib/comercial/pack-calle-catalog"

export type IndustryProductLine = "clavis" | "clavergrow"

export interface IndustryTemplate {
  /** ID del selector (puede diferir del rubro almacenado) */
  id: string
  /** Valor persistido en empresa.rubro */
  rubro: Rubro
  label: string
  emoji: string
  group: IndustryGroup
  tagline: string
  wowMoment: string
  productLine: IndustryProductLine
  /** Demo retail calle → applyRetailOnboarding */
  isRetail: boolean
  /** Clave parametrizacion-rubro.ts */
  parametrizacionKey: string
  engancheId?: string
  /** Primer módulo de valor — redirect post-login demo */
  goldenPath: string
  /** href → label contextual en sidebar */
  menuLabels: Record<string, string>
  /** moduloKey / section label → nombre contextual */
  sectionLabels?: Record<string, string>
  featured?: boolean
}

export type IndustryGroup =
  | "Comercio de calle"
  | "Salud & mascotas"
  | "Servicios & fitness"
  | "Gastronomía"
  | "Agro & acopio"
  | "Distribución & logística"
  | "Industria & especializados"

const PARAM: Record<string, string> = {
  kiosco: "comercio",
  ferreteria: "comercio",
  farmacia: "salud",
  supermercado: "comercio",
  ropa: "comercio",
  libreria: "comercio",
  bar_restaurant: "gastronomia",
  veterinaria: "veterinaria",
  clinica: "salud",
  salon_belleza: "servicios",
  gimnasio: "salud",
  canchas: "servicios",
  estacion_servicio: "comercio",
  distribuidora: "distribucion",
  agro_acopio: "comercio",
  agro_cannabis: "comercio",
  prestamista: "profesional",
  concesionaria: "comercio",
  importador: "comercio",
  reventa_tendencias: "comercio",
  quimica: "industria",
  textil_fabrica: "industria",
  otro: "comercio",
}

function tpl(
  partial: Omit<IndustryTemplate, "parametrizacionKey" | "productLine"> & {
    parametrizacionKey?: string
    productLine?: IndustryProductLine
  },
): IndustryTemplate {
  const rubro = partial.rubro
  return {
    parametrizacionKey: partial.parametrizacionKey ?? PARAM[rubro] ?? "comercio",
    productLine: partial.productLine ?? (rubro.startsWith("agro_") ? "clavergrow" : "clavis"),
    ...partial,
  }
}

/** Todas las industrias disponibles en el sensor comercial */
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  tpl({
    id: "almacen",
    rubro: "kiosco",
    label: "Almacén de barrio",
    emoji: "🛒",
    group: "Comercio de calle",
    tagline: "Fiado, caja y stock sin Excel.",
    wowMoment: "Anotá un fiado en 2 toques y mandá WhatsApp.",
    isRetail: true,
    engancheId: "pos.fiado_barrio",
    goldenPath: "/dashboard/fiado",
    featured: true,
    menuLabels: {
      "/dashboard/fiado": "Quién me debe",
      "/dashboard/caja": "Caja rápida",
      "/dashboard/pos": "Mostrador",
      "/dashboard/productos": "Inventario",
      "/dashboard/clientes": "Vecinos",
    },
    sectionLabels: { ventas: "Caja & Fiado", stock: "Inventario" },
  }),
  tpl({
    id: "kiosco",
    rubro: "kiosco",
    label: "Kiosco",
    emoji: "🏪",
    group: "Comercio de calle",
    tagline: "Venta rápida y fiado de confianza.",
    wowMoment: "Fiado con WhatsApp automático al vecino.",
    isRetail: true,
    engancheId: "pool-kiosco-barrio",
    goldenPath: "/dashboard/fiado",
    menuLabels: {
      "/dashboard/pos": "Caja rápida",
      "/dashboard/fiado": "Libreta fiado",
      "/dashboard/productos": "Inventario",
    },
  }),
  tpl({
    id: "ferreteria",
    rubro: "ferreteria",
    label: "Corralón / Ferretería",
    emoji: "🧱",
    group: "Comercio de calle",
    tagline: "Mostrador, mayorista y stock crítico.",
    wowMoment: "Presupuesto por voz con stock en vivo.",
    isRetail: true,
    engancheId: "pos.core",
    goldenPath: "/dashboard/ventas",
    featured: true,
    menuLabels: {
      "/dashboard/pos": "Mostrador POS",
      "/dashboard/ventas": "Facturación",
      "/dashboard/compras": "Reposición",
      "/dashboard/productos": "Catálogo",
      "/dashboard/caja": "Caja",
      "/dashboard/clientes": "Clientes",
    },
  }),
  tpl({
    id: "farmacia",
    rubro: "farmacia",
    label: "Farmacia",
    emoji: "💊",
    group: "Salud & mascotas",
    tagline: "Obra social, stock y vencimientos.",
    wowMoment: "Alerta de lote por vencer antes de perder plata.",
    isRetail: true,
    engancheId: "pos.core",
    goldenPath: "/dashboard/ventas",
    menuLabels: {
      "/dashboard/ventas": "Mostrador",
      "/dashboard/productos": "Medicamentos",
    },
  }),
  tpl({
    id: "veterinaria",
    rubro: "veterinaria",
    label: "Veterinaria",
    emoji: "🐕",
    group: "Salud & mascotas",
    tagline: "Historias clínicas, turnos y mostrador.",
    wowMoment: "Perfil de Bobby — recetá y cobrá en un flujo.",
    goldenPath: "/dashboard/historia-clinica",
    engancheId: "niche.vet_barrio",
    featured: true,
    menuLabels: {
      "/dashboard/veterinaria": "Pacientes",
      "/dashboard/historia-clinica": "Historias clínicas",
      "/dashboard/agenda": "Turnos",
      "/dashboard/pos": "Mostrador",
      "/dashboard/ventas": "Facturación",
      "/dashboard/clientes": "Tutores",
    },
    sectionLabels: { servicios: "Atención", ventas: "Mostrador" },
  }),
  tpl({
    id: "clinica",
    rubro: "clinica",
    label: "Clínica / Consultorio",
    emoji: "🩺",
    group: "Salud & mascotas",
    tagline: "Turnos, historia clínica y facturación OS.",
    wowMoment: "Agenda por especialidad con cobranza integrada.",
    goldenPath: "/dashboard/agenda",
    engancheId: "niche.consultorio_solo",
    menuLabels: {
      "/dashboard/agenda": "Turnos",
      "/dashboard/historia-clinica": "Historia clínica",
      "/dashboard/ventas": "Facturación",
    },
  }),
  tpl({
    id: "gimnasio",
    rubro: "gimnasio",
    label: "Gimnasio / Pilates",
    emoji: "🏋️",
    group: "Servicios & fitness",
    tagline: "Socios, cuotas y morosos en semáforo.",
    wowMoment: "Reclamá cuota vencida por WhatsApp con un botón.",
    goldenPath: "/dashboard/membresias",
    featured: true,
    menuLabels: {
      "/dashboard/membresias": "Socios",
      "/dashboard/agenda": "Clases",
      "/dashboard/clientes": "Socios",
      "/dashboard/cuentas-cobrar": "Cuotas vencidas",
      "/dashboard/caja": "Cobros",
    },
    sectionLabels: { servicios: "Socios & clases" },
  }),
  tpl({
    id: "salon_belleza",
    rubro: "salon_belleza",
    label: "Salón / Barbería",
    emoji: "💇",
    group: "Servicios & fitness",
    tagline: "Turnos, comisiones y venta de insumos.",
    wowMoment: "Recordatorio WhatsApp 24hs antes del turno.",
    goldenPath: "/dashboard/agenda",
    engancheId: "niche.consultorio_solo",
    featured: true,
    menuLabels: {
      "/dashboard/agenda": "Turnos",
      "/dashboard/peluqueria": "Agenda mobile",
      "/dashboard/pos": "Cobro",
      "/dashboard/ventas": "Cobro servicios",
      "/dashboard/clientes": "Clientas",
    },
  }),
  tpl({
    id: "estacion_servicio",
    rubro: "estacion_servicio",
    label: "Estación de servicio",
    emoji: "⛽",
    group: "Distribución & logística",
    tagline: "Flotas, surtidores y minimercado.",
    wowMoment: "Cuenta corriente de flotas con cierre por turno.",
    goldenPath: "/dashboard/cuentas-cobrar",
    featured: true,
    menuLabels: {
      "/dashboard/cuentas-cobrar": "Flotas / CC",
      "/dashboard/ventas": "Cierre surtidor",
      "/dashboard/caja": "Cierre de turno",
      "/dashboard/clientes": "Empresas de transporte",
      "/dashboard/productos": "Minimercado",
    },
    sectionLabels: { ventas: "Playa & tienda", financiero: "Flotas & caja" },
  }),
  tpl({
    id: "bar_restaurant",
    rubro: "bar_restaurant",
    label: "Gastronomía",
    emoji: "🍽️",
    group: "Gastronomía",
    tagline: "Mesas, cocina y caja en un flujo.",
    wowMoment: "Marchá empanadas y bajá stock de carne al instante.",
    goldenPath: "/dashboard/hospitalidad",
    featured: true,
    menuLabels: {
      "/dashboard/hospitalidad": "Salón",
      "/dashboard/hospitalidad/kds": "Cocina",
      "/dashboard/caja": "Caja",
      "/dashboard/toma-pedidos": "Comandas",
    },
    sectionLabels: { servicios: "Salón & cocina" },
  }),
  tpl({
    id: "distribuidora",
    rubro: "distribuidora",
    label: "Distribuidora",
    emoji: "🚚",
    group: "Distribución & logística",
    tagline: "Rutas, picking y cobranza en ruta.",
    wowMoment: "Pedido del vendedor → picking → remito sin doble carga.",
    goldenPath: "/dashboard/picking",
    menuLabels: {
      "/dashboard/picking": "Picking",
      "/dashboard/logistica": "Rutas",
      "/dashboard/ventas": "Pedidos",
      "/dashboard/clientes": "Clientes B2B",
    },
  }),
  tpl({
    id: "agro_acopio",
    rubro: "agro_acopio",
    label: "Acopio / Campo",
    emoji: "🌾",
    group: "Agro & acopio",
    tagline: "Balanza, contratos y pizarra BCR.",
    wowMoment: "Pesá un camión y actualizá stock al instante.",
    productLine: "clavergrow",
    goldenPath: "/dashboard/agro/balanza/nuevo",
    menuLabels: {
      "/dashboard/agro": "Clavergrow",
      "/dashboard/agro/balanza": "Balanza camiones",
      "/dashboard/agro/contratos": "Contratos cereales",
      "/dashboard/agro/pizarra": "Pizarra BCR",
    },
  }),
  tpl({
    id: "agro_cannabis",
    rubro: "agro_cannabis",
    label: "Cultivo regulado",
    emoji: "🌿",
    group: "Agro & acopio",
    tagline: "Trazabilidad REPROCANN de punta a punta.",
    wowMoment: "Ciclo completo con insumos y compliance.",
    productLine: "clavergrow",
    goldenPath: "/dashboard/agro/cannabis",
    menuLabels: {
      "/dashboard/agro/cannabis": "Cultivo regulado",
      "/dashboard/agro/cannabis/ciclos": "Ciclos",
    },
  }),
  tpl({
    id: "carniceria",
    rubro: "kiosco",
    label: "Carnicería",
    emoji: "🥩",
    group: "Comercio de calle",
    tagline: "Balanza, fiado y venta por kg.",
    wowMoment: "Ticket de balanza integrado a caja.",
    isRetail: true,
    engancheId: "pos.balanza_peso",
    goldenPath: "/dashboard/pos",
    menuLabels: { "/dashboard/pos": "Balanza & caja" },
  }),
  tpl({
    id: "panaderia",
    rubro: "kiosco",
    label: "Panadería",
    emoji: "🥐",
    group: "Comercio de calle",
    tagline: "Producción, mostrador y fiado.",
    wowMoment: "Fiado del panadero de confianza en 2 clics.",
    isRetail: true,
    engancheId: "pos.fiado_barrio",
    goldenPath: "/dashboard/fiado",
    menuLabels: { "/dashboard/fiado": "Fiado clientes" },
  }),
  tpl({
    id: "supermercado",
    rubro: "supermercado",
    label: "Supermercado",
    emoji: "🛍️",
    group: "Comercio de calle",
    tagline: "Múltiples cajas y stock perecedero.",
    wowMoment: "Cierre Z por caja sin diferencias.",
    goldenPath: "/dashboard/caja",
    menuLabels: { "/dashboard/caja": "Cajas", "/dashboard/ventas": "Facturación" },
  }),
  tpl({
    id: "prestamista",
    rubro: "prestamista",
    label: "Prestamista / Financiera",
    emoji: "💰",
    group: "Industria & especializados",
    tagline: "Préstamos, pagarés y cobranza en ruta.",
    wowMoment: "Agenda de cobros del día con un clic.",
    goldenPath: "/dashboard/fiado",
    engancheId: "niche.prestamo_barrio",
    featured: true,
    menuLabels: {
      "/dashboard/fiado": "Libreta de deudores",
      "/dashboard/prestamos": "Cartera préstamos",
      "/dashboard/clientes": "Deudores",
    },
  }),
  tpl({
    id: "freelance_mt",
    rubro: "servicios",
    label: "Monotributista / freelance",
    emoji: "💼",
    group: "Servicios & fitness",
    tagline: "Presupuesto, factura C y cobro sin Excel.",
    wowMoment: "Cotizá en la calle y mandá factura C al aceptar.",
    goldenPath: "/dashboard/ventas/presupuestos",
    engancheId: "pool-monotributo",
    featured: true,
    menuLabels: {
      "/dashboard/ventas/presupuestos": "Presupuestos",
      "/dashboard/cuentas-cobrar": "Cobros",
      "/dashboard/clientes": "Clientes",
    },
  }),
  tpl({
    id: "servicios_pro",
    rubro: "servicios",
    label: "Empresa de servicios",
    emoji: "🔧",
    group: "Servicios & fitness",
    tagline: "Agenda, presupuestos y cobranza unificados.",
    wowMoment: "El técnico ve su turno y la oficina ve quién debe.",
    goldenPath: "/dashboard/agenda",
    engancheId: "pool-servicios-pro",
    featured: true,
    menuLabels: {
      "/dashboard/agenda": "Agenda",
      "/dashboard/ventas/presupuestos": "Presupuestos",
      "/dashboard/cuentas-cobrar": "Cobros",
    },
  }),
  tpl({
    id: "contratista_obra",
    rubro: "otro",
    label: "Contratista / obra",
    emoji: "🔨",
    group: "Industria & especializados",
    tagline: "Jornales, adelantos y liquidación semanal.",
    wowMoment: "Liquidación del viernes en 5 minutos.",
    goldenPath: "/dashboard/nicho/obras",
    engancheId: "pool-obra",
    featured: true,
    menuLabels: {
      "/dashboard/nicho/obras": "Obra",
      "/dashboard/cuentas-cobrar": "Hitos cliente",
      "/dashboard/clientes": "Obreros",
    },
  }),
  tpl({
    id: "inmobiliaria",
    rubro: "otro",
    label: "Inmobiliaria y consorcios",
    emoji: "🏠",
    group: "Industria & especializados",
    tagline: "Expensas, contratos y portales inmobiliarios.",
    wowMoment: "Liquidá el mes y publicá en Zonaprop desde un panel.",
    goldenPath: "/dashboard/nicho/consorcios",
    engancheId: "pool-propiedad",
    featured: true,
    menuLabels: {
      "/dashboard/nicho/consorcios": "Consorcios",
      "/dashboard/nicho/inmobiliaria": "Cartera",
      "/dashboard/nicho/garantia": "Contratos",
      "/dashboard/nicho/portales": "Portales",
      "/dashboard/clientes": "Inquilinos",
    },
  }),
  tpl({
    id: "consorcios_admin",
    rubro: "otro",
    label: "Administración de consorcios",
    emoji: "🏢",
    group: "Industria & especializados",
    tagline: "Expensas, gastos y avisos a inquilinos.",
    wowMoment: "Liquidá el mes y avisá por WhatsApp a todos.",
    goldenPath: "/dashboard/nicho/consorcios",
    engancheId: "niche.consorcios",
    menuLabels: {
      "/dashboard/nicho/consorcios": "Consorcios",
      "/dashboard/clientes": "Inquilinos",
    },
  }),
  tpl({
    id: "club_barrio",
    rubro: "otro",
    label: "Club de barrio",
    emoji: "⚽",
    group: "Servicios & fitness",
    tagline: "Cuotas de socios sin cuaderno.",
    wowMoment: "WhatsApp a morosos antes del partido.",
    goldenPath: "/dashboard/nicho/club",
    engancheId: "niche.club_barrio",
    menuLabels: { "/dashboard/nicho/club": "Cuotas socios" },
  }),
  tpl({
    id: "tintoreria",
    rubro: "servicios",
    label: "Tintorería / Lavadero",
    emoji: "👔",
    group: "Servicios & fitness",
    tagline: "Tickets y aviso cuando la ropa está lista.",
    wowMoment: "Marcá LISTO → WhatsApp al cliente.",
    goldenPath: "/dashboard/nicho/plancha",
    engancheId: "niche.tintoreria",
    menuLabels: { "/dashboard/nicho/plancha": "Tickets" },
  }),
  tpl({
    id: "feria_puesto",
    rubro: "otro",
    label: "Feria / permisionario",
    emoji: "🛍️",
    group: "Comercio de calle",
    tagline: "Cierre de feria y cuota en un solo lugar.",
    wowMoment: "Cierre del día + aviso a permisionarios.",
    goldenPath: "/dashboard/nicho/feria",
    engancheId: "niche.feria_puesto",
    menuLabels: { "/dashboard/nicho/feria": "Cierre feria" },
  }),
  tpl({
    id: "obra_changas",
    rubro: "otro",
    label: "Obra / changas",
    emoji: "🔨",
    group: "Industria & especializados",
    tagline: "Jornales y adelantos sin pelea.",
    wowMoment: "Liquidación semanal con saldo neto por obrero.",
    goldenPath: "/dashboard/nicho/obras",
    engancheId: "niche.obra_changas",
    menuLabels: { "/dashboard/nicho/obras": "Jornales" },
  }),
  tpl({
    id: "acopio_grano",
    rubro: "agro_acopio",
    label: "Acopio / productor",
    emoji: "🌾",
    group: "Agro & acopio",
    tagline: "Entregas y liquidaciones del productor.",
    wowMoment: "Cada entrega queda con kg, precio y saldo.",
    goldenPath: "/dashboard/nicho/acopio",
    engancheId: "niche.acopio_grano",
    menuLabels: { "/dashboard/nicho/acopio": "Entregas" },
  }),
  tpl({
    id: "base_remis",
    rubro: "servicios",
    label: "Remisería / base",
    emoji: "🚕",
    group: "Distribución & logística",
    tagline: "Cierre por chofer sin planilla.",
    wowMoment: "Cierre diario por chofer con alerta si no cuadra.",
    goldenPath: "/dashboard/nicho/remis",
    engancheId: "niche.base_remis",
    menuLabels: { "/dashboard/nicho/remis": "Cierre choferes" },
  }),
  tpl({
    id: "consultorio_solo",
    rubro: "clinica",
    label: "Consultorio médico",
    emoji: "🩺",
    group: "Salud & mascotas",
    tagline: "Turnos y recordatorios sin secretaria.",
    wowMoment: "Turno confirmado por WhatsApp automático.",
    goldenPath: "/dashboard/agenda",
    engancheId: "niche.consultorio_solo",
    menuLabels: { "/dashboard/agenda": "Turnos" },
  }),
  tpl({
    id: "inmo_garantia",
    rubro: "otro",
    label: "Inmobiliaria / garantías",
    emoji: "🔑",
    group: "Industria & especializados",
    tagline: "Contratos y vencimientos bajo control.",
    wowMoment: "Alerta 30 días antes → WhatsApp a inquilino.",
    goldenPath: "/dashboard/nicho/garantia",
    engancheId: "niche.inmo_garantia",
    menuLabels: { "/dashboard/nicho/garantia": "Contratos" },
  }),
  tpl({
    id: "cooperativa_cuotas",
    rubro: "otro",
    label: "Cooperativa / mutuo",
    emoji: "🤝",
    group: "Servicios & fitness",
    tagline: "Socios y aportes sin libro.",
    wowMoment: "Estado del socio + convocatoria por WhatsApp.",
    goldenPath: "/dashboard/nicho/mutuo",
    engancheId: "niche.cooperativa_cuotas",
    menuLabels: { "/dashboard/nicho/mutuo": "Aportes socios" },
  }),
  tpl({
    id: "escuela_barrio",
    rubro: "otro",
    label: "Escuela / instituto",
    emoji: "🎒",
    group: "Servicios & fitness",
    tagline: "Cuotas escolares sin cuaderno.",
    wowMoment: "Cuota del mes + WhatsApp a morosos.",
    goldenPath: "/dashboard/nicho/escuela",
    engancheId: "niche.escuela_barrio",
    menuLabels: { "/dashboard/nicho/escuela": "Cuotas alumnos" },
  }),
  tpl({
    id: "cancha_barrio",
    rubro: "canchas",
    label: "Cancha / complejo deportivo",
    emoji: "⚽",
    group: "Servicios & fitness",
    tagline: "Turnos y seña sin planilla.",
    wowMoment: "Turno confirmado + seña en un toque.",
    goldenPath: "/dashboard/nicho/cancha",
    engancheId: "niche.cancha_barrio",
    menuLabels: { "/dashboard/nicho/cancha": "Reservas" },
  }),
  tpl({
    id: "taller_mecanico",
    rubro: "otro",
    label: "Taller mecánico",
    emoji: "🔧",
    group: "Industria & especializados",
    tagline: "Órdenes de trabajo con aviso automático.",
    wowMoment: "Auto listo → WhatsApp al cliente.",
    goldenPath: "/dashboard/nicho/taller",
    engancheId: "niche.taller_mecanico",
    menuLabels: { "/dashboard/nicho/taller": "Órdenes" },
  }),
  tpl({
    id: "delivery_barrio",
    rubro: "otro",
    label: "Delivery local",
    emoji: "🛵",
    group: "Distribución & logística",
    tagline: "Pedidos y cierre por repartidor.",
    wowMoment: "Cierre del turno con alerta si no cuadra.",
    goldenPath: "/dashboard/nicho/delivery",
    engancheId: "niche.delivery_barrio",
    menuLabels: { "/dashboard/nicho/delivery": "Pedidos" },
  }),
  tpl({
    id: "peluqueria_barrio",
    rubro: "salon_belleza",
    label: "Peluquería / barbería",
    emoji: "💇",
    group: "Servicios & fitness",
    tagline: "Turnos y recordatorios sin cuaderno.",
    wowMoment: "Recordatorio WhatsApp 24hs antes.",
    goldenPath: "/dashboard/nicho/peluqueria",
    engancheId: "niche.peluqueria_barrio",
    menuLabels: { "/dashboard/nicho/peluqueria": "Turnos" },
  }),
  tpl({
    id: "gimnasio_barrio",
    rubro: "gimnasio",
    label: "Gimnasio de barrio",
    emoji: "🏋️",
    group: "Servicios & fitness",
    tagline: "Socios y cuotas en semáforo.",
    wowMoment: "Cuota vencida → WhatsApp con un botón.",
    goldenPath: "/dashboard/nicho/gimnasio",
    engancheId: "niche.gimnasio_barrio",
    menuLabels: { "/dashboard/nicho/gimnasio": "Cuotas socios" },
  }),
  tpl({
    id: "colonia_verano",
    rubro: "otro",
    label: "Colonia de verano",
    emoji: "🏕️",
    group: "Servicios & fitness",
    tagline: "Inscripciones y cuotas de colonia.",
    wowMoment: "Aviso masivo a familias morosas.",
    goldenPath: "/dashboard/nicho/colonia",
    engancheId: "niche.colonia_verano",
    menuLabels: { "/dashboard/nicho/colonia": "Inscripciones" },
  }),
  tpl({
    id: "salon_eventos",
    rubro: "otro",
    label: "Salón de eventos",
    emoji: "🎉",
    group: "Servicios & fitness",
    tagline: "Eventos, señas y saldo claro.",
    wowMoment: "Seña + recordatorio de saldo por WhatsApp.",
    goldenPath: "/dashboard/nicho/salon",
    engancheId: "niche.salon_eventos",
    menuLabels: { "/dashboard/nicho/salon": "Eventos" },
  }),
  tpl({
    id: "vet_barrio",
    rubro: "veterinaria",
    label: "Veterinaria de barrio",
    emoji: "🐕",
    group: "Salud & mascotas",
    tagline: "Fichas y vacunas sin carpeta.",
    wowMoment: "Vacuna pendiente → WhatsApp al tutor.",
    goldenPath: "/dashboard/historia-clinica",
    engancheId: "niche.vet_barrio",
    menuLabels: { "/dashboard/historia-clinica": "Fichas mascotas" },
  }),
  tpl({
    id: "pena_folklore",
    rubro: "otro",
    label: "Peña cultural",
    emoji: "🎵",
    group: "Servicios & fitness",
    tagline: "Socios y cuotas de la peña.",
    wowMoment: "Morosos avisados antes del show.",
    goldenPath: "/dashboard/nicho/pena",
    engancheId: "niche.pena_folklore",
    menuLabels: { "/dashboard/nicho/pena": "Cuotas socios" },
  }),
  tpl({
    id: "concesionaria",
    rubro: "concesionaria",
    label: "Concesionaria",
    emoji: "🚗",
    group: "Industria & especializados",
    tagline: "Stock de usados, leads y comisiones.",
    wowMoment: "Ficha técnica + margen por unidad.",
    goldenPath: "/dashboard/concesionaria",
    menuLabels: { "/dashboard/concesionaria": "Vehículos" },
  }),
  tpl({
    id: "quimica",
    rubro: "quimica",
    label: "Fábrica química",
    emoji: "⚗️",
    group: "Industria & especializados",
    tagline: "BOM, lotes y trazabilidad NFPA.",
    wowMoment: "Fórmula maestra → producción → lote PT.",
    goldenPath: "/dashboard/industria",
    menuLabels: { "/dashboard/industria": "Producción" },
  }),
  tpl({
    id: "otro",
    rubro: "otro",
    label: "Otro comercio",
    emoji: "🏢",
    group: "Comercio de calle",
    tagline: "ERP configurable para tu rubro.",
    wowMoment: "Primera factura en menos de 10 minutos.",
    goldenPath: "/dashboard/ventas",
    menuLabels: {},
  }),
]

const BY_ID = new Map(INDUSTRY_TEMPLATES.map((t) => [t.id, t]))
const BY_RUBRO = new Map<string, IndustryTemplate>()

for (const t of INDUSTRY_TEMPLATES) {
  if (!BY_RUBRO.has(t.rubro) || t.featured) {
    BY_RUBRO.set(t.rubro, t)
  }
}

export const INDUSTRY_GROUPS: IndustryGroup[] = [
  "Comercio de calle",
  "Salud & mascotas",
  "Servicios & fitness",
  "Gastronomía",
  "Distribución & logística",
  "Agro & acopio",
  "Industria & especializados",
]

export function getIndustryTemplate(industryId: string): IndustryTemplate | null {
  const direct = BY_ID.get(industryId)
  if (direct) return direct
  const rubro = normalizeRubroValue(industryId)
  return BY_RUBRO.get(rubro) ?? null
}

export function getIndustryTemplateByRubro(rubro: string | null | undefined): IndustryTemplate | null {
  if (!rubro) return null
  const normalized = normalizeRubroValue(rubro)
  return BY_RUBRO.get(normalized) ?? BY_ID.get(rubro) ?? null
}

export function getGoldenPathForRubro(rubro: string | null | undefined): string {
  const template = getIndustryTemplateByRubro(rubro)
  if (template) return template.goldenPath
  const ux = getRubroUx(rubro)
  return ux.quickActions[0]?.href ?? "/dashboard"
}

export function listIndustriesByGroup(group?: IndustryGroup): IndustryTemplate[] {
  const list = group
    ? INDUSTRY_TEMPLATES.filter((t) => t.group === group)
    : INDUSTRY_TEMPLATES
  return list
}

export function resolveIndustryEnganche(template: IndustryTemplate): string {
  return template.engancheId ?? engancheParaRubro(template.id) ?? "pos.fiado_barrio"
}

/** Prioriza industryId (demo) sobre rubro almacenado — corrige almacén vs kiosco */
export function resolveIndustryContext(
  rubro: string | null | undefined,
  industryId?: string | null,
): IndustryTemplate | null {
  if (industryId) {
    const byId = getIndustryTemplate(industryId)
    if (byId) return byId
  }
  return getIndustryTemplateByRubro(rubro)
}

export function getMenuLabelForRubro(
  href: string,
  defaultLabel: string,
  rubro: string | null | undefined,
  industryId?: string | null,
): string {
  const template = resolveIndustryContext(rubro, industryId)
  return template?.menuLabels[href] ?? defaultLabel
}

export function getSectionLabelForRubro(
  sectionKey: string | undefined,
  defaultLabel: string,
  rubro: string | null | undefined,
  industryId?: string | null,
): string {
  if (!sectionKey) return defaultLabel
  const template = resolveIndustryContext(rubro, industryId)
  return template?.sectionLabels?.[sectionKey] ?? defaultLabel
}

export const DEMO_INDUSTRY_IDS = INDUSTRY_TEMPLATES.filter((t) => t.featured || t.id !== "otro").map(
  (t) => t.id,
)