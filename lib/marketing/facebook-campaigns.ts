/**
 * Campañas Facebook Ads — link canónico, UTMs y módulos CORE del ERP.
 * Localhost y producción (claver.com.ar) usan el mismo path `/erp`.
 */

export const CLAVER_PRODUCTION_ORIGIN = "https://claver.com.ar"

export const FACEBOOK_LANDING_PATH = "/erp"

export type FacebookCampaignId = "erp-core"

export interface CoreErpModule {
  id: string
  label: string
  tagline: string
  dashboardPath: string
}

export interface FacebookCampaign {
  id: FacebookCampaignId
  nombre: string
  descripcion: string
  path: string
  utmSource: "facebook"
  utmMedium: "paid"
  utmCampaign: string
  utmContent: string
  headline: string
  textoPrincipal: string
  textoCorto: string
  ctaMeta: string
  ctaLanding: string
}

export const CORE_ERP_MODULES: CoreErpModule[] = [
  { id: "pos", label: "Punto de venta", tagline: "Cobrá en el mostrador, ticket en el acto.", dashboardPath: "/dashboard/pos" },
  { id: "caja", label: "Caja", tagline: "Apertura, movimientos y cierre de turno.", dashboardPath: "/dashboard/caja" },
  { id: "stock", label: "Stock", tagline: "Productos, faltantes y depósitos.", dashboardPath: "/dashboard/productos" },
  { id: "clientes", label: "Clientes", tagline: "Ficha, saldos y cuenta corriente.", dashboardPath: "/dashboard/clientes" },
  { id: "ventas", label: "Ventas", tagline: "Pedidos, comprobantes y listas.", dashboardPath: "/dashboard/ventas" },
  { id: "presupuestos", label: "Presupuestos", tagline: "Cotizá y convertí a venta.", dashboardPath: "/dashboard/ventas/presupuestos" },
  { id: "compras", label: "Compras", tagline: "Órdenes, remitos y facturas de proveedor.", dashboardPath: "/dashboard/compras" },
  { id: "proveedores", label: "Proveedores", tagline: "Maestro y cuentas a pagar.", dashboardPath: "/dashboard/proveedores" },
  { id: "facturas", label: "Facturas AFIP", tagline: "Factura A/B/C con CAE.", dashboardPath: "/dashboard/facturas" },
  { id: "impuestos", label: "Impuestos", tagline: "IVA, IIBB y presentaciones.", dashboardPath: "/dashboard/impuestos" },
  { id: "cxc", label: "Cuentas a cobrar", tagline: "Quién debe y vencimientos.", dashboardPath: "/dashboard/cuentas-cobrar" },
  { id: "cxp", label: "Cuentas a pagar", tagline: "Pagos a proveedores.", dashboardPath: "/dashboard/cuentas-pagar" },
  { id: "banco", label: "Banco", tagline: "Cuentas, transferencias y conciliación.", dashboardPath: "/dashboard/banco" },
  { id: "contabilidad", label: "Contabilidad", tagline: "Asientos, balances y períodos.", dashboardPath: "/dashboard/contabilidad" },
  { id: "agenda", label: "Agenda / turnos", tagline: "Reservas y confirmaciones.", dashboardPath: "/dashboard/agenda" },
  { id: "crm", label: "CRM", tagline: "Pipeline comercial.", dashboardPath: "/dashboard/crm" },
  { id: "reportes", label: "Reportes", tagline: "Ventas, caja y tableros.", dashboardPath: "/dashboard/reportes" },
  { id: "kpis", label: "KPIs", tagline: "Indicadores del dueño.", dashboardPath: "/dashboard/kpis" },
]

export const FACEBOOK_CAMPAIGNS: FacebookCampaign[] = [
  {
    id: "erp-core",
    nombre: "ERP Core — video Facebook",
    descripcion:
      "Tráfico del video de funciones CORE. Destino: catálogo del ERP y entrada al sistema completo (demo).",
    path: FACEBOOK_LANDING_PATH,
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "erp-core",
    utmContent: "video",
    headline: "Caja, stock, factura y cobro. Un sistema.",
    textoPrincipal:
      "Caja, stock, cierre, factura AFIP, cobro por WhatsApp, turnos y compras.\n\nUn solo sistema para el comercio. En la computadora o en el celular.\n\nDejá de saltar de Excel a la impresora y al WhatsApp. En Claver cobrás, controlás el stock, cerrás la caja, emitís factura y mandás el cobro desde el mismo lugar.",
    textoCorto: "Caja. Stock. Factura. Cobro. Turnos. El sistema del negocio, en el celular.",
    ctaMeta: "Más información",
    ctaLanding: "Entrar al ERP",
  },
]

export const FACEBOOK_CAMPAIGN_ERP_CORE = FACEBOOK_CAMPAIGNS[0]

export function getFacebookCampaign(id: string): FacebookCampaign | undefined {
  return FACEBOOK_CAMPAIGNS.find((c) => c.id === id)
}

export function buildFacebookCampaignUrl(
  origin: string,
  campaign: FacebookCampaign = FACEBOOK_CAMPAIGN_ERP_CORE,
): string {
  const base = origin.replace(/\/$/, "")
  const params = new URLSearchParams({
    utm_source: campaign.utmSource,
    utm_medium: campaign.utmMedium,
    utm_campaign: campaign.utmCampaign,
    utm_content: campaign.utmContent,
    ref: "fb",
  })
  return `${base}${campaign.path}?${params.toString()}`
}

export function productionFacebookUrl(campaign: FacebookCampaign = FACEBOOK_CAMPAIGN_ERP_CORE): string {
  return buildFacebookCampaignUrl(CLAVER_PRODUCTION_ORIGIN, campaign)
}

export function isSafeDashboardPath(path: string | null | undefined): path is string {
  const p = path?.trim() ?? ""
  if (!p.startsWith("/") || p.startsWith("//")) return false
  if (!p.startsWith("/dashboard")) return false
  return !p.includes("://")
}
