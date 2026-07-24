/**
 * Portfolio freemium monetizable Ã¢â‚¬â€ 11 micro-SaaS Claver.
 * Fuente de verdad comercial: precios, anclas, upsell, shells, SKUs.
 *
 * Docs: docs/comercial/MICRO_SAAS_FREEMIUM_10.md
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import type { MarketplaceSku } from "@/lib/marketplace/marketplace-catalog"

/** Evita ciclos: no importar sub-saas-catalog / enganche-catalog desde aquÃƒÂ­ */
export type MicroEngancheTier = "implementado" | "parcial" | "catalogo"
export type MicroEngancheNicho =
  | "almacen_barrio"
  | "pyme_cobranzas"
  | "ecommerce"
  | "seguridad_ops"
  | "fiscal"
  | "marketing"
  | "horizontal"
export type MicroSaasEstado = "disponible" | "beta" | "proximamente"

export type MicroSaasSlug =
  | "fiado"
  | "cobra"
  | "confirma"
  | "expensas"
  | "renta"
  | "sena"
  | "cuota"
  | "caja"
  | "abono"
  | "reactiva"
  | "ruta"

export interface MicroSaasProducto {
  /** Orden comercial (1 = ancla de volumen) */
  orden: number
  slug: MicroSaasSlug
  /** Alias de slug legacy en sub-saas (si difiere) */
  subSaasSlug?: string
  marca: string
  nombre: string
  lema: string
  descripcion: string
  sku: string
  skusAdicionales?: string[]
  precioArs: number
  /** Ancla gratis permanente (sin tarjeta) */
  anclaGratis: boolean
  trialDias: number
  modoLite: ModoLite
  dashboardPath: string
  publicPath?: string
  estado: MicroSaasEstado
  listoPct: number
  tier: MicroEngancheTier
  nichos: MicroEngancheNicho[]
  rubros: string[]
  anclaGratisDetalle: string
  gatilloPago: string
  roiCopy: string
  freeLimit: string
  paidTrigger: string
  upsellSkus: string[]
  navPaths: string[]
  procesosReciclados: string[]
  serviciosBackend: string[]
  shellTabs: { href: string; label: string }[]
  primaryAction: { label: string; href: string }
  reelHook: string
  pains: string[]
  outcomes: string[]
  pasosActivacion: string[]
  vendibleCalle: boolean
}

export const MICRO_SAAS_PORTFOLIO: MicroSaasProducto[] = [
  {
    orden: 1,
    slug: "fiado",
    marca: "Claver Fiado",
    nombre: "Libreta Fiado Digital",
    lema: "Gratis para siempre. FiÃƒÂ¡ con lÃƒÂ­mite desde el celular.",
    descripcion:
      "Libreta de fiado del barrio. LÃƒÂ­mite por cliente, historial y saldo. SubÃƒÂ­ a CobrÃƒÂ¡ cuando quieras avisos y links de pago.",
    sku: "pos.fiado_barrio",
    precioArs: 0,
    anclaGratis: true,
    trialDias: 14,
    modoLite: "fiado",
    dashboardPath: "/dashboard/fiado",
    estado: "disponible",
    listoPct: 90,
    tier: "implementado",
    nichos: ["almacen_barrio"],
    rubros: ["almacÃƒÂ©n", "kiosco", "carnicerÃƒÂ­a", "fiambrerÃƒÂ­a"],
    anclaGratisDetalle: "Libreta digital + deudores + historial en pantalla",
    gatilloPago: "Avisos WA + link MP + mora automÃƒÂ¡tica Ã¢â€ â€™ Claver CobrÃƒÂ¡",
    roiCopy: "1 cobro recuperado paga 3Ã¢â‚¬â€œ6 meses del upsell CobrÃƒÂ¡",
    freeLimit: "Fiado ilimitado; 0 envÃƒÂ­os automÃƒÂ¡ticos de cobro",
    paidTrigger: "intang.cobranzas_wa + com.whatsapp + fiscal.clavpay_link",
    upsellSkus: ["intang.cobranzas_wa", "com.whatsapp", "fiscal.clavpay_link", "core.claver"],
    navPaths: ["/dashboard/fiado", "/dashboard/pos", "/dashboard/clientes"],
    procesosReciclados: ["fiado-service", "saldoCuentaCorriente", "deudores"],
    serviciosBackend: ["lib/fiado/fiado-service.ts", "app/dashboard/fiado/page.tsx", "app/api/fiado"],
    shellTabs: [
      { href: "/dashboard/fiado", label: "Libreta" },
      { href: "/dashboard/pos", label: "Mostrador" },
      { href: "/dashboard/clientes", label: "Clientes" },
      { href: "/dashboard/configuracion", label: "Ajustes" },
    ],
    primaryAction: { label: "Anotar fiado", href: "/dashboard/fiado" },
    reelHook: "DejÃƒÂ¡ el cuaderno. Fiado con lÃƒÂ­mite en el celu.",
    pains: ["Fiado en papel", "LÃƒÂ­mite superado", "No sÃƒÂ© quiÃƒÂ©n debe"],
    outcomes: ["LÃƒÂ­mite por cliente", "Libreta en vivo", "Base para CobrÃƒÂ¡"],
    pasosActivacion: [
      "Activar pos.fiado_barrio (gratis)",
      "Alta de clientes del barrio",
      "Configurar lÃƒÂ­mites",
      "Anotar primer fiado",
    ],
    vendibleCalle: true,
  },
  {
    orden: 2,
    slug: "cobra",
    marca: "Claver CobrÃƒÂ¡",
    nombre: "Cobranzas por WhatsApp",
    lema: "El mensaje cobra. Vos seguÃƒÂ­s vendiendo.",
    descripcion:
      "CxC con secuencias de WhatsApp, panel recuperable y links de pago. Menos llamadas, mÃƒÂ¡s recupero.",
    sku: "intang.cobranzas_wa",
    skusAdicionales: ["com.whatsapp", "fiscal.clavpay_link"],
    precioArs: 19900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    estado: "disponible",
    listoPct: 85,
    tier: "implementado",
    nichos: ["almacen_barrio", "pyme_cobranzas"],
    rubros: ["almacÃƒÂ©n", "servicios", "distribuidora", "freelance"],
    anclaGratisDetalle: "Ver CxC y aging; marcar cobrado a mano (trial)",
    gatilloPago: "Secuencia WA D+1/D+7 + links MP automÃƒÂ¡ticos",
    roiCopy: "1 factura cobrada a tiempo paga el aÃƒÂ±o de suscripciÃƒÂ³n",
    freeLimit: "Trial 14d; luego sin envÃƒÂ­os auto",
    paidTrigger: "Cola WA + cron cobranza + secretaria",
    upsellSkus: ["pos.fiado_barrio", "fiscal.clavpay_link", "core.claver", "micro.claver_ruta"],
    navPaths: ["/dashboard/cuentas-cobrar", "/dashboard/clientes"],
    procesosReciclados: ["cuentaCobrar", "cobranzas-wa", "deudor-pago-link"],
    serviciosBackend: [
      "lib/marketplace/cobranzas-wa-service.ts",
      "lib/cobranza/as-a-service.ts",
      "lib/cc-cp/cuentas-service.ts",
    ],
    shellTabs: [
      { href: "/dashboard/cuentas-cobrar", label: "Cobros" },
      { href: "/dashboard/clientes", label: "Clientes" },
      { href: "/dashboard/configuracion", label: "Ajustes" },
    ],
    primaryAction: { label: "Ver morosos", href: "/dashboard/cuentas-cobrar" },
    reelHook: "CobrÃƒÂ¡ sin quedar mal Ã¢â‚¬â€ el sistema avisa.",
    pains: ["CxC sin seguimiento", "Llamadas incÃƒÂ³modas", "No sÃƒÂ© cuÃƒÂ¡nto recupero"],
    outcomes: ["Recordatorios automÃƒÂ¡ticos", "Panel recuperable", "Links de pago"],
    pasosActivacion: [
      "Activar intang.cobranzas_wa",
      "Cargar clientes con saldo",
      "Configurar dÃƒÂ­as y tope diario",
      "Aprobar o auto-enviar WA",
    ],
    vendibleCalle: true,
  },
  {
    orden: 3,
    slug: "confirma",
    subSaasSlug: "turnos",
    marca: "Claver ConfirmÃƒÂ¡",
    nombre: "Turnos que confirman solos",
    lema: "Menos no-shows. MÃƒÂ¡s sillas ocupadas.",
    descripcion:
      "Agenda + recordatorio WhatsApp la vÃƒÂ­spera. El cliente confirma o libera el hueco.",
    sku: "micro.confirma_turnos",
    skusAdicionales: ["niche.peluqueria_barrio", "com.whatsapp"],
    precioArs: 14900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/agenda",
    publicPath: "/agenda-online/{empresaId}",
    estado: "disponible",
    listoPct: 80,
    tier: "implementado",
    nichos: ["marketing", "horizontal"],
    rubros: ["peluquerÃƒÂ­a", "barberÃƒÂ­a", "estÃƒÂ©tica", "consultorio", "veterinaria"],
    anclaGratisDetalle: "Agenda manual de turnos (trial)",
    gatilloPago: "Recordatorio auto vÃƒÂ­spera + CONFIRMAR/CANCELAR",
    roiCopy: "1 no-show evitado por semana paga 4 meses",
    freeLimit: "Turnos UI; 0 recordatorios auto sin pago",
    paidTrigger: "Job recordatorios + cola WA",
    upsellSkus: ["fiscal.clavpay_link", "intang.cobranzas_wa", "core.claver"],
    navPaths: ["/dashboard/agenda", "/dashboard/clientes"],
    procesosReciclados: ["agenda-service", "Turno", "recordatorios job"],
    serviciosBackend: [
      "lib/agenda/agenda-service.ts",
      "lib/scheduling/jobs/recordatorios.ts",
      "app/api/agenda-publica",
    ],
    shellTabs: [
      { href: "/dashboard/agenda", label: "Agenda" },
      { href: "/dashboard/clientes", label: "Clientes" },
      { href: "/dashboard/configuracion", label: "Ajustes" },
    ],
    primaryAction: { label: "Nuevo turno", href: "/dashboard/agenda" },
    reelHook: "10 audios por un turno vs un recordatorio automÃƒÂ¡tico.",
    pains: ["No-shows", "Agenda en papel", "CoordinaciÃƒÂ³n por WA"],
    outcomes: ["Menos ausencias", "Huecos liberados", "Link de reserva"],
    pasosActivacion: [
      "Activar micro.confirma_turnos",
      "Cargar profesionales y servicios",
      "Compartir agenda online",
      "Activar recordatorios WA",
    ],
    vendibleCalle: true,
  },
  {
    orden: 4,
    slug: "expensas",
    marca: "Claver Expensas",
    nombre: "Expensas del edificio",
    lema: "LiquidÃƒÂ¡ el mes y avisÃƒÂ¡ a todos en un toque.",
    descripcion:
      "Unidades, liquidaciÃƒÂ³n de expensas, morosos y cobro. Ideal para administrador informal de PH.",
    sku: "niche.consorcios",
    skusAdicionales: ["intang.cobranzas_wa", "com.whatsapp"],
    precioArs: 24900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/nicho/consorcios",
    estado: "disponible",
    listoPct: 75,
    tier: "implementado",
    nichos: ["horizontal", "pyme_cobranzas"],
    rubros: ["consorcio", "ph", "edificio"],
    anclaGratisDetalle: "Unidades + expensa del mes en pantalla (trial)",
    gatilloPago: "LiquidaciÃƒÂ³n masiva + WA morosos + link cobro",
    roiCopy: "1 expensa cobrada a tiempo paga 2Ã¢â‚¬â€œ3 meses",
    freeLimit: "1 consorcio / 12 UF en trial",
    paidTrigger: "Job consorcios-alertas + envÃƒÂ­os",
    upsellSkus: ["intang.cobranzas_wa", "fiscal.clavpay_link", "pool-propiedad"],
    navPaths: ["/dashboard/nicho/consorcios", "/dashboard/cuentas-cobrar"],
    procesosReciclados: ["consorcios-service", "morosos", "cobro expensas"],
    serviciosBackend: [
      "lib/consorcios/consorcios-service.ts",
      "lib/consorcios/consorcios-morosos-service.ts",
      "lib/scheduling/jobs/consorcios-alertas.ts",
    ],
    shellTabs: [
      { href: "/dashboard/nicho/consorcios", label: "Expensas" },
      { href: "/dashboard/cuentas-cobrar", label: "Cobros" },
      { href: "/dashboard/clientes", label: "Unidades" },
    ],
    primaryAction: { label: "Liquidar mes", href: "/dashboard/nicho/consorcios" },
    reelHook: "Expensas en Excel vs un botÃƒÂ³n y WhatsApp a morosos.",
    pains: ["Excel de expensas", "Morosos sin avisar", "Cobro uno por uno"],
    outcomes: ["LiquidaciÃƒÂ³n del mes", "Aviso masivo", "Link de pago"],
    pasosActivacion: [
      "Activar niche.consorcios",
      "Cargar unidades y residentes",
      "Liquidar perÃƒÂ­odo",
      "Avisar morosos",
    ],
    vendibleCalle: true,
  },
  {
    orden: 5,
    slug: "renta",
    marca: "Claver Renta",
    nombre: "Alquileres del dueÃƒÂ±o",
    lema: "Vencimientos claros. Cobro a tiempo.",
    descripcion:
      "Para el dueÃƒÂ±o de 1Ã¢â‚¬â€œ10 departamentos: contratos, vencimientos, aviso y link de cobro al inquilino.",
    sku: "micro.renta_dueno",
    skusAdicionales: ["niche.inmo_garantia", "intang.cobranzas_wa"],
    precioArs: 19900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/nicho/inmobiliaria",
    estado: "disponible",
    listoPct: 70,
    tier: "parcial",
    nichos: ["horizontal", "pyme_cobranzas"],
    rubros: ["alquileres", "propietario", "inmobiliaria chica"],
    anclaGratisDetalle: "Contratos + vencimientos en lista (trial)",
    gatilloPago: "Aviso pre-vencimiento + recibo + link MP",
    roiCopy: "Adelantar 5 dÃƒÂ­as un alquiler de $400k = ROI Ãƒâ€”10",
    freeLimit: "2 contratos en free/trial",
    paidTrigger: "Job inmobiliaria-alertas + cobro",
    upsellSkus: ["niche.consorcios", "intang.cobranzas_wa", "pool-propiedad"],
    navPaths: ["/dashboard/nicho/inmobiliaria", "/dashboard/cuentas-cobrar"],
    procesosReciclados: ["alquileres-service", "propiedad", "CxC"],
    serviciosBackend: [
      "lib/inmobiliaria/alquileres-service.ts",
      "lib/inmobiliaria/inmobiliaria-service.ts",
      "lib/scheduling/jobs/inmobiliaria-alertas.ts",
    ],
    shellTabs: [
      { href: "/dashboard/nicho/inmobiliaria", label: "Cartera" },
      { href: "/dashboard/cuentas-cobrar", label: "Cobros" },
      { href: "/dashboard/clientes", label: "Inquilinos" },
    ],
    primaryAction: { label: "Ver vencimientos", href: "/dashboard/nicho/inmobiliaria" },
    reelHook: "El inquilino se olvida. El sistema no.",
    pains: ["Vencimientos en papel", "Cobro tarde", "Sin recibos claros"],
    outcomes: ["Agenda de alquileres", "Aviso a tiempo", "Link de pago"],
    pasosActivacion: [
      "Activar micro.renta_dueno",
      "Cargar propiedades y contratos",
      "Configurar dÃƒÂ­a de cobro",
      "Activar avisos",
    ],
    vendibleCalle: true,
  },
  {
    orden: 6,
    slug: "sena",
    marca: "Claver SeÃƒÂ±a",
    nombre: "SeÃƒÂ±as y reservas",
    lema: "ReservÃƒÂ¡. CobrÃƒÂ¡s la seÃƒÂ±a. LiberÃƒÂ¡s si no paga.",
    descripcion:
      "Presupuestos/reservas con seÃƒÂ±a para canchas, salones, fotÃƒÂ³grafos y eventos. Link de cobro y saldo.",
    sku: "micro.sena_reserva",
    skusAdicionales: ["fiscal.clavpay_link", "com.whatsapp"],
    precioArs: 14900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "servicios",
    dashboardPath: "/dashboard/ventas/presupuestos",
    estado: "disponible",
    listoPct: 72,
    tier: "parcial",
    nichos: ["horizontal", "marketing"],
    rubros: ["canchas", "eventos", "fotografÃƒÂ­a", "salones"],
    anclaGratisDetalle: "Reserva/presupuesto con estado seÃƒÂ±a manual",
    gatilloPago: "Link seÃƒÂ±a MP + recordatorio saldo + no-show fee",
    roiCopy: "1 seÃƒÂ±a cobrada evita un dÃƒÂ­a perdido",
    freeLimit: "Presupuestos ilimitados; links de seÃƒÂ±a = paid",
    paidTrigger: "Preferencia MP + WA saldos",
    upsellSkus: ["intang.cobranzas_wa", "micro.confirma_turnos", "core.claver"],
    navPaths: ["/dashboard/ventas/presupuestos", "/dashboard/clientes", "/dashboard/cuentas-cobrar"],
    procesosReciclados: ["presupuesto-service", "MP preferencia", "CxC"],
    serviciosBackend: [
      "lib/presupuesto/presupuesto-service.ts",
      "lib/mercadopago/mercadopago-service.ts",
      "app/api/ventas/presupuestos",
    ],
    shellTabs: [
      { href: "/dashboard/ventas/presupuestos", label: "Reservas" },
      { href: "/dashboard/cuentas-cobrar", label: "SeÃƒÂ±as" },
      { href: "/dashboard/clientes", label: "Clientes" },
    ],
    primaryAction: { label: "Nueva reserva", href: "/dashboard/ventas/presupuestos" },
    reelHook: "Te reservan y no pagan. Con seÃƒÂ±a online, no.",
    pains: ["Reservas fantasma", "SeÃƒÂ±as por transferencia confusa", "Saldo olvidado"],
    outcomes: ["SeÃƒÂ±a con link", "Estado claro", "Menos no-shows de eventos"],
    pasosActivacion: [
      "Activar micro.sena_reserva",
      "Crear presupuesto con % seÃƒÂ±a",
      "Enviar link de cobro",
      "Confirmar al pagar",
    ],
    vendibleCalle: true,
  },
  {
    orden: 7,
    slug: "cuota",
    subSaasSlug: "puntos",
    marca: "Claver Cuota",
    nombre: "Cuotas de socio / gym",
    lema: "Socios, planes y morosos sin cuaderno.",
    descripcion:
      "Planes, membresÃƒÂ­as y cobro de cuotas para gym de barrio, pilates y clubes.",
    sku: "niche.gimnasio_barrio",
    skusAdicionales: ["com.whatsapp", "intang.cobranzas_wa"],
    precioArs: 19900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/membresias",
    estado: "disponible",
    listoPct: 78,
    tier: "implementado",
    nichos: ["horizontal", "marketing"],
    rubros: ["gimnasio", "pilates", "club", "cafeterÃƒÂ­a"],
    anclaGratisDetalle: "Socios y planes; cobro manual (trial)",
    gatilloPago: "Avisos vencimiento + WA morosos + link cuota",
    roiCopy: "2 cuotas recuperadas pagan el mes",
    freeLimit: "Hasta 40 socios en free light",
    paidTrigger: "Cron renovaciÃƒÂ³n + cola WA",
    upsellSkus: ["com.whatsapp", "intang.cobranzas_wa", "core.claver"],
    navPaths: ["/dashboard/membresias", "/dashboard/nicho/gimnasio", "/dashboard/clientes"],
    procesosReciclados: ["membresias", "PlanMembresia", "cuotas engine"],
    serviciosBackend: [
      "lib/membresias/membresias-service.ts",
      "app/api/membresias/route.ts",
      "lib/scheduling/jobs/renovacion-abonos.ts",
    ],
    shellTabs: [
      { href: "/dashboard/membresias", label: "Socios" },
      { href: "/dashboard/cuentas-cobrar", label: "Cuotas" },
      { href: "/dashboard/clientes", label: "Clientes" },
    ],
    primaryAction: { label: "Registrar socio", href: "/dashboard/membresias" },
    reelHook: "Cuaderno de socios vs panel de morosos en un toque.",
    pains: ["Cuotas en papel", "Morosos sin avisar", "No saber quiÃƒÂ©n estÃƒÂ¡ al dÃƒÂ­a"],
    outcomes: ["Planes claros", "Morosos visibles", "WhatsApp de cuota"],
    pasosActivacion: [
      "Activar niche.gimnasio_barrio",
      "Definir planes",
      "Registrar socios",
      "Cobrar / avisar cuotas",
    ],
    vendibleCalle: true,
  },
  {
    orden: 8,
    slug: "caja",
    marca: "Claver Caja",
    nombre: "Caja y arqueo inteligente",
    lema: "Que no se escape un peso del mostrador.",
    descripcion:
      "Apertura/cierre, alerta de caja abierta y arqueo ciego. Control para dueÃƒÂ±os que no estÃƒÂ¡n siempre en el local.",
    sku: "micro.caja_control",
    skusAdicionales: ["pos.arqueo_ciego", "intang.guardian_pos"],
    precioArs: 14900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/caja",
    estado: "disponible",
    listoPct: 82,
    tier: "implementado",
    nichos: ["almacen_barrio", "seguridad_ops"],
    rubros: ["kiosco", "almacÃƒÂ©n", "retail", "bar"],
    anclaGratisDetalle: "Abrir/cerrar caja y ver movimientos",
    gatilloPago: "Alerta +12h + arqueo ciego + diferencias",
    roiCopy: "1 desvÃƒÂ­o de $20k detectado paga 1 aÃƒÂ±o",
    freeLimit: "Caja manual; sin playbook alerta",
    paidTrigger: "Playbook cierre_caja_alerta + arqueo ciego",
    upsellSkus: ["core.claver", "pos.fiado_barrio", "intang.guardian_pos"],
    navPaths: ["/dashboard/caja", "/dashboard/pos"],
    procesosReciclados: ["caja", "arqueo", "guardian_pos"],
    serviciosBackend: [
      "lib/caja/arqueo-service.ts",
      "lib/almacen-rosario/arqueo-ciego-service.ts",
      "lib/automation/virtual-workers-catalog.ts",
    ],
    shellTabs: [
      { href: "/dashboard/caja", label: "Caja" },
      { href: "/dashboard/pos", label: "Mostrador" },
      { href: "/dashboard/configuracion", label: "Ajustes" },
    ],
    primaryAction: { label: "Abrir caja", href: "/dashboard/caja" },
    reelHook: "Cierre a ojo vs arqueo ciego.",
    pains: ["Caja abierta de ayer", "DesvÃƒÂ­os de cajero", "Sin control remoto"],
    outcomes: ["Alertas", "Arqueo serio", "Trazabilidad"],
    pasosActivacion: [
      "Activar micro.caja_control",
      "Abrir primera caja",
      "Activar arqueo ciego",
      "Revisar alertas",
    ],
    vendibleCalle: true,
  },
  {
    orden: 9,
    slug: "abono",
    marca: "Claver Abono",
    nombre: "FacturaciÃƒÂ³n recurrente",
    lema: "El abono del mes se emite solo.",
    descripcion:
      "Plantillas de abono mensual (mantenimiento, mutuales, clubs). EmisiÃƒÂ³n automÃƒÂ¡tica y enganche a cobranza.",
    sku: "micro.abono_recurrente",
    skusAdicionales: ["intang.cobranzas_wa"],
    precioArs: 24900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "servicios",
    dashboardPath: "/dashboard/facturacion-recurrente",
    estado: "beta",
    listoPct: 68,
    tier: "parcial",
    nichos: ["horizontal", "pyme_cobranzas"],
    rubros: ["mantenimiento", "servicios", "mutual", "club"],
    anclaGratisDetalle: "Lista de abonos; emisiÃƒÂ³n manual Ã¢â‚¬Å“generar ahoraÃ¢â‚¬Â",
    gatilloPago: "Cron diario de emisiÃƒÂ³n + CC + cobranza",
    roiCopy: "1 abono de $50k olvidado que se emite solo paga 2 meses",
    freeLimit: "3 abonos, emisiÃƒÂ³n manual",
    paidTrigger: "facturacion-recurrente cron + CobrÃƒÂ¡",
    upsellSkus: ["intang.cobranzas_wa", "core.claver", "fiscal.clavpay_link"],
    navPaths: ["/dashboard/facturacion-recurrente", "/dashboard/cuentas-cobrar"],
    procesosReciclados: ["FacturaRecurrente", "generarCCPorFactura"],
    serviciosBackend: [
      "lib/ventas/facturacion-recurrente-service.ts",
      "lib/scheduling/jobs/facturacion-recurrente.ts.bak",
    ],
    shellTabs: [
      { href: "/dashboard/facturacion-recurrente", label: "Abonos" },
      { href: "/dashboard/cuentas-cobrar", label: "Cobros" },
      { href: "/dashboard/clientes", label: "Clientes" },
    ],
    primaryAction: { label: "Ver abonos", href: "/dashboard/facturacion-recurrente" },
    reelHook: "Se te olvidÃƒÂ³ facturar el abono. Al sistema no.",
    pains: ["Olvido de emisiÃƒÂ³n", "Excel de abonos", "Cobro desordenado"],
    outcomes: ["EmisiÃƒÂ³n del ciclo", "CC automÃƒÂ¡tica", "Enganche CobrÃƒÂ¡"],
    pasosActivacion: [
      "Activar micro.abono_recurrente",
      "Definir abonos por cliente",
      "Probar emisiÃƒÂ³n manual",
      "Activar cron (paid)",
    ],
    vendibleCalle: true,
  },
  {
    orden: 10,
    slug: "reactiva",
    marca: "Claver Reactiva",
    nombre: "Despertador de clientes",
    lema: "Oro de la basura: clientes dormidos.",
    descripcion:
      "DetectÃƒÂ¡ quiÃƒÂ©n no vuelve hace 60Ã¢â‚¬â€œ90 dÃƒÂ­as y reactivÃƒÂ¡ con WhatsApp y ofertas.",
    sku: "intang.reactivador_clientes",
    skusAdicionales: ["com.whatsapp"],
    precioArs: 12900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/crm",
    estado: "beta",
    listoPct: 55,
    tier: "parcial",
    nichos: ["marketing", "pyme_cobranzas"],
    rubros: ["retail", "salÃƒÂ³n", "vet", "gym"],
    anclaGratisDetalle: "Lista de dormidos (top 20) read-only",
    gatilloPago: "CampaÃƒÂ±a WA + tracking reactivados",
    roiCopy: "1 cliente reactivado (ticket medio) paga 3 meses",
    freeLimit: "Lista top 20; 0 envÃƒÂ­os",
    paidTrigger: "Cola WA + cron semanal",
    upsellSkus: ["com.whatsapp", "intang.cobranzas_wa", "core.claver"],
    navPaths: ["/dashboard/crm", "/dashboard/clientes"],
    procesosReciclados: ["CRM", "whatsapp-outbound", "IA mensajes"],
    serviciosBackend: [
      "lib/scheduling/jobs/whatsapp-outbound.ts",
      "lib/ai/ai-business.ts",
    ],
    shellTabs: [
      { href: "/dashboard/crm", label: "Dormidos" },
      { href: "/dashboard/clientes", label: "Clientes" },
      { href: "/dashboard/configuracion", label: "Ajustes" },
    ],
    primaryAction: { label: "Ver dormidos", href: "/dashboard/crm" },
    reelHook: "Clientes que no vuelven = plata dormida.",
    pains: ["Base frÃƒÂ­a", "No hay tiempo de llamar", "Promos a ciegas"],
    outcomes: ["Lista de dormidos", "CampaÃƒÂ±a WA", "MediciÃƒÂ³n de reactivados"],
    pasosActivacion: [
      "Activar intang.reactivador_clientes",
      "Revisar lista de inactivos",
      "Armar plantilla WA",
      "Lanzar campaÃƒÂ±a (paid)",
    ],
    vendibleCalle: true,
  },
  {
    orden: 11,
    slug: "ruta",
    marca: "Claver Ruta",
    nombre: "Vendedor en ruta + cuotas de stock",
    lema: "Tu ruta. Sus cuotas. Su historial.",
    descripcion:
      "Mapa de la ruta del dÃƒÂ­a, ficha con historial del cliente y venta de artÃƒÂ­culos de stock en cuotas. Para distribuidoras y preventistas.",
    sku: "micro.claver_ruta",
    skusAdicionales: ["intang.cobranzas_wa", "com.whatsapp", "fiscal.clavpay_link"],
    precioArs: 24900,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/vendedor",
    estado: "beta",
    listoPct: 65,
    tier: "parcial",
    nichos: ["almacen_barrio", "pyme_cobranzas"],
    rubros: ["distribuidora", "mayorista", "ferreterÃƒÂ­a", "preventa"],
    anclaGratisDetalle:
      "Ruta del dÃƒÂ­a (lista) + historial cliente + venta a cuotas de stock manual (Ã¢â€°Â¤25 clientes, 1 vendedor)",
    gatilloPago:
      "Mapa optimizado + cobro auto de cuotas (WA/MP) + stock campo + offline multi-vendedor",
    roiCopy: "1 cuota cobrada en calle + 1 pedido extra en la ruta pagan el mes",
    freeLimit: "1 vendedor Ã‚Â· 25 clientes Ã‚Â· sin auto-cobro de cuotas",
    paidTrigger: "Geocode/ruta + cron cuotas + sync offline",
    upsellSkus: ["intang.cobranzas_wa", "core.claver", "pos.fiado_barrio"],
    navPaths: ["/vendedor", "/dashboard/ventas", "/dashboard/cuentas-cobrar", "/dashboard/clientes"],
    procesosReciclados: [
      "app/vendedor",
      "cuentas-service cuotas",
      "ventas-service vendedorId",
      "maps/nominatim",
      "historial cliente/facturas/CxC",
    ],
    serviciosBackend: [
      "app/vendedor/page.tsx",
      "lib/maps/nominatim-geocode.ts",
      "lib/maps/hoja-ruta-catalog.ts",
      "lib/cc-cp/cuentas-service.ts",
      "lib/ventas/ventas-service.ts",
    ],
    shellTabs: [
      { href: "/vendedor", label: "Mapa / Ruta" },
      { href: "/dashboard/clientes", label: "Clientes" },
      { href: "/dashboard/cuentas-cobrar", label: "Cuotas" },
      { href: "/dashboard/ventas", label: "Pedidos" },
      { href: "/dashboard/productos", label: "Stock" },
    ],
    primaryAction: { label: "Abrir ruta", href: "/vendedor" },
    reelHook: "Excel de ruta vs mapa + cuotas + historial en el celu.",
    pains: ["Ruta en la cabeza", "Cuotas de mercaderÃƒÂ­a en papel", "No recuerdo quÃƒÂ© le vendÃƒÂ­"],
    outcomes: ["Ruta del dÃƒÂ­a", "Cuotas de stock", "Historial en la visita"],
    pasosActivacion: [
      "Activar micro.claver_ruta",
      "Asignar clientes al vendedor",
      "Armar ruta del dÃƒÂ­a",
      "Vender en cuotas / cobrar en calle",
    ],
    vendibleCalle: true,
  },
]

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export function getMicroSaasBySlug(slug: string): MicroSaasProducto | undefined {
  return MICRO_SAAS_PORTFOLIO.find((p) => p.slug === slug || p.subSaasSlug === slug)
}

export function getMicroSaasBySku(sku: string): MicroSaasProducto | undefined {
  return MICRO_SAAS_PORTFOLIO.find(
    (p) => p.sku === sku || p.skusAdicionales?.includes(sku),
  )
}

export function microSaasVendiblesCalle(): MicroSaasProducto[] {
  return MICRO_SAAS_PORTFOLIO.filter((p) => p.vendibleCalle).sort((a, b) => a.orden - b.orden)
}

export function microSaasAnclasGratis(): MicroSaasProducto[] {
  return MICRO_SAAS_PORTFOLIO.filter((p) => p.anclaGratis)
}

export function microSaasActivarHref(p: MicroSaasProducto): string {
  return `/login?activar=${encodeURIComponent(p.sku)}`
}

export function microSaasLandingHref(p: MicroSaasProducto): string {
  const slug = p.subSaasSlug ?? p.slug
  return `/claver/apps/${slug}`
}

export function microSaasResumenComercial() {
  const vendibles = microSaasVendiblesCalle()
  return {
    total: MICRO_SAAS_PORTFOLIO.length,
    anclasGratis: microSaasAnclasGratis().length,
    disponibles: vendibles.filter((p) => p.estado === "disponible").length,
    beta: vendibles.filter((p) => p.estado === "beta").length,
    arpuPromedioArs: Math.round(
      vendibles.filter((p) => p.precioArs > 0).reduce((s, p) => s + p.precioArs, 0) /
        Math.max(1, vendibles.filter((p) => p.precioArs > 0).length),
    ),
    skus: MICRO_SAAS_PORTFOLIO.map((p) => p.sku),
  }
}

/** SKUs del portfolio (primarios + adicionales) para seed / registry */
export function microSaasAllSkus(): string[] {
  const set = new Set<string>()
  for (const p of MICRO_SAAS_PORTFOLIO) {
    set.add(p.sku)
    p.skusAdicionales?.forEach((s) => set.add(s))
  }
  return [...set]
}

export function microSaasToMarketplaceSku(p: MicroSaasProducto): MarketplaceSku {
  return {
    sku: p.sku,
    nombre: p.marca,
    categoria: "Micro-SaaS Freemium",
    precioArs: p.precioArs,
    tipoCobro: "recurrente",
    autoCertLevel: p.tier === "implementado" ? "GLOBAL_AUTO" : "SEMI_AUTO",
    paisesHabilitados: ["AR"],
    i18n: {
      "es-AR": {
        nombre: p.marca,
        descripcion: `${p.descripcion} | Free: ${p.anclaGratisDetalle} | Paid: ${p.gatilloPago} | ROI: ${p.roiCopy}`,
        packOnboardSubject: `${p.marca} activado Ã¢â‚¬â€ ${p.lema}`,
      },
    },
    segmentoAds: p.rubros,
    playbookId: `playbook.${p.sku}`,
    dependeDe: p.skusAdicionales?.filter((s) => s.startsWith("com.") || s.startsWith("core.")),
    status: p.estado === "proximamente" ? "planned" : p.estado === "beta" ? "beta" : "disponible",
    trialDias: p.trialDias,
  }
}

export function microSaasMarketplaceEntries(): MarketplaceSku[] {
  return MICRO_SAAS_PORTFOLIO.map(microSaasToMarketplaceSku)
}

export function microSaasToEnganche(p: MicroSaasProducto) {
  return {
    sku: p.sku,
    nombre: p.marca,
    lema: p.lema,
    tier: p.tier,
    nichos: p.nichos.length ? p.nichos : (["horizontal"] as MicroEngancheNicho[]),
    precioArs: p.precioArs,
    upsellA: p.upsellSkus,
    dolorResuelve: p.pains[0] ?? p.descripcion,
  }
}

export function microSaasEnganchesNuevos(existingSkus: Set<string>) {
  return MICRO_SAAS_PORTFOLIO.filter((p) => !existingSkus.has(p.sku)).map(microSaasToEnganche)
}

export function microSaasToSubSaasApp(p: MicroSaasProducto) {
  return {
    slug: p.subSaasSlug ?? p.slug,
    marca: p.marca,
    nombre: p.nombre,
    lema: p.lema,
    descripcion: p.descripcion,
    sku: p.sku,
    skusAdicionales: p.skusAdicionales,
    precioArs: p.precioArs,
    trialDias: p.trialDias,
    modoLite: p.modoLite,
    dashboardPath: p.dashboardPath,
    publicPath: p.publicPath,
    procesosReciclados: p.procesosReciclados,
    serviciosBackend: p.serviciosBackend,
    listoPct: p.listoPct,
    estado: p.estado,
    plataforma: "ambos" as const,
    redesScore: 8,
    impactoScore: 9,
    rubros: p.rubros,
    reelHook: p.reelHook,
    pains: p.pains,
    outcomes: p.outcomes,
    pasosActivacion: p.pasosActivacion,
    upsellSkus: p.upsellSkus,
  }
}

/** Apps a agregar al catÃƒÂ¡logo sub-saas si el slug aÃƒÂºn no existe */
export function microSaasSubSaasToAppend(existingSlugs: Set<string>) {
  return MICRO_SAAS_PORTFOLIO.filter((p) => {
    const slug = p.subSaasSlug ?? p.slug
    return !existingSlugs.has(slug)
  }).map(microSaasToSubSaasApp)
}

export function microSaasHorizontalProductos() {
  return MICRO_SAAS_PORTFOLIO.map((p) => ({
    sku: p.sku,
    nombre: p.marca,
    lema: p.lema,
    tier: p.tier as MicroEngancheTier | "pack",
    horizontal: true as const,
    precioArs: p.precioArs,
    dependeDe: [] as string[],
    navPaths: p.navPaths,
  }))
}

/** Seed ProductoComercial rows for billing FK */
export function microSaasSeedRows() {
  return MICRO_SAAS_PORTFOLIO.map((p) => ({
    sku: p.sku,
    nombre: p.marca,
    descripcion: p.descripcion.slice(0, 240),
    precioArs: p.precioArs,
    activo: p.estado !== "proximamente",
  }))
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Colectivos (landing sin saturar: 4 familias, no 11 cards) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * Agrupa micro-SaaS en Ã¢â‚¬Å“marcas hermanasÃ¢â‚¬Â por dolor.
 * Home: 4 tarjetas de colectivo Ã¢â€ â€™ cada una abre 2Ã¢â‚¬â€œ4 productos.
 * Hero sigue con 3 dolores (fiado / cobra / turnos).
 */
export type MicroSaasColectivoId = "mostrador" | "cobro" | "agenda" | "propiedad" | "autos"

export interface MicroSaasColectivo {
  id: MicroSaasColectivoId
  /** Nombre del colectivo como si fuera un sello / lÃƒÂ­nea de producto */
  nombre: string
  lema: string
  /** QuiÃƒÂ©n se siente aludido en 1 lÃƒÂ­nea */
  paraQuien: string
  emoji: string
  /** Color accent Tailwind (border/bg) */
  accent: "emerald" | "sky" | "violet" | "amber"
  /** Slugs del portfolio en orden de venta (primero = hero del colectivo) */
  productSlugs: MicroSaasSlug[]
  /** CTA principal del colectivo */
  ctaLabel: string
  /** Ancla en /claver/apps o registro del producto lÃƒÂ­der */
  ctaHref: string
}

export const MICRO_SAAS_COLECTIVOS: MicroSaasColectivo[] = [
  {
    id: "mostrador",
    nombre: "Claver Mostrador",
    lema: "Fiado, caja y ruta Ã¢â‚¬â€ el dÃƒÂ­a a dÃƒÂ­a del negocio.",
    paraQuien: "AlmacÃƒÂ©n, kiosco, distribuidora, vendedor de calle",
    emoji: "Ã°Å¸ÂÂª",
    accent: "emerald",
    productSlugs: ["fiado", "caja", "ruta"],
    ctaLabel: "Empezar con Fiado gratis",
    ctaHref: "/login?activar=pos.fiado_barrio",
  },
  {
    id: "cobro",
    nombre: "Claver Cobro",
    lema: "Que te paguen: avisos, seÃƒÂ±as, abonos y reactivaciÃƒÂ³n.",
    paraQuien: "PyME con deudores, eventos, abonos mensuales",
    emoji: "Ã°Å¸â€™Â¸",
    accent: "sky",
    productSlugs: ["cobra", "sena", "abono", "reactiva"],
    ctaLabel: "Probar CobrÃƒÂ¡ 14 dÃƒÂ­as",
    ctaHref: "/login?activar=intang.cobranzas_wa",
  },
  {
    id: "agenda",
    nombre: "Claver Agenda",
    lema: "Turnos que confirman y cuotas de socios al dÃƒÂ­a.",
    paraQuien: "PeluquerÃƒÂ­a, estÃƒÂ©tica, gym, club, consultorio",
    emoji: "Ã°Å¸â€œâ€¦",
    accent: "violet",
    productSlugs: ["confirma", "cuota"],
    ctaLabel: "Probar ConfirmÃƒÂ¡ 14 dÃƒÂ­as",
    ctaHref: "/login?activar=micro.confirma_turnos",
  },
    {
      id: "autos",
      nombre: "Claver Autos",
      lema: "Stock, consignaciones y margen de reventa.",
      paraQuien: "Concesionarias de usados, revendedores",
      emoji: "ðŸš—",
      accent: "amber",
      productSlugs: ["caja", "ruta"],
      ctaLabel: "Abrir mÃ³dulo Autos",
      ctaHref: "/login?activar=pos.caja",
    },
  {
    id: "propiedad",
    nombre: "Claver Propiedad",
    lema: "Expensas del edificio y alquileres del dueÃƒÂ±o.",
    paraQuien: "Admin de PH informal, dueÃƒÂ±o de 1Ã¢â‚¬â€œ10 depas",
    emoji: "Ã°Å¸ÂÂ¢",
    accent: "amber",
    productSlugs: ["expensas", "renta"],
    ctaLabel: "Ver Expensas",
    ctaHref: "/login?activar=niche.consorcios",
  },
]

export function getColectivo(id: string): MicroSaasColectivo | undefined {
  return MICRO_SAAS_COLECTIVOS.find((c) => c.id === id)
}

export function productsForColectivo(id: MicroSaasColectivoId): MicroSaasProducto[] {
  const c = getColectivo(id)
  if (!c) return []
  return c.productSlugs
    .map((slug) => getMicroSaasBySlug(slug))
    .filter((p): p is MicroSaasProducto => Boolean(p))
}

/** Mapea dolor del hero (3 chips) Ã¢â€ â€™ colectivo relacionado para deep-link */
export function colectivoFromHomeDolor(dolor: string): MicroSaasColectivoId {
  if (dolor === "cobra") return "cobro"
  if (dolor === "turnos") return "agenda"
  return "mostrador"
}
