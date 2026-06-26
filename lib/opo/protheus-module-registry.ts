import type { OpoCanonicalEntity } from "./types"

export interface ProtheusModuleMeta {
  id: string
  nombre: string
  siglaProtheus: string
  descripcion: string
  paraQueSirve: string
  opoEntities: OpoCanonicalEntity[]
  clavisApps: { sku: string; nombre: string; comoComplementa: string }[]
  monetizacion: string
  patrones: RegExp[]
}

/** Reglas de clasificación + documentación funcional por módulo TOTVS */
export const PROTHEUS_MODULE_REGISTRY: ProtheusModuleMeta[] = [
  {
    id: "stock",
    nombre: "Inventario y costos",
    siglaProtheus: "SIGAEST / MATA",
    descripcion: "Stock, kardex, costos, depósitos, inventario y reaperturas.",
    paraQueSirve:
      "Consulta saldos, movimientos, cálculo de costos (MATA280/330/350), depósitos y divergencias de inventario.",
    opoEntities: ["Product"],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Lee SB1/SB2 y expone Product canónico al mini front." },
      { sku: "erp.stock", nombre: "Stock Clavis", comoComplementa: "Sincroniza existencias si el cliente migra gradualmente." },
    ],
    monetizacion: "Pack legacy + módulo Stock; cobro por conector inventario en tiempo real.",
    patrones: [/\/api\/stock\//i, /trackcosts/i, /kardex/i, /warehouses/i, /mata\d+/i],
  },
  {
    id: "productos",
    nombre: "Maestro de productos",
    siglaProtheus: "SB1 / AC Product",
    descripcion: "Catálogo de productos, tipos, grupos y perfiles de configuración.",
    paraQueSirve: "Lista y mantiene productos, estructuras de campos y perfiles AC.",
    opoEntities: ["Product"],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Mapea /api/acproduct/v1/products → opo:Product." },
      { sku: "erp.maestros", nombre: "Maestros ERP", comoComplementa: "Catálogo unificado si híbrido." },
    ],
    monetizacion: "Activación bridge.opo_studio + SKU maestros para sync bidireccional.",
    patrones: [/\/api\/acproduct/i, /\/aclist\//i, /producttypes/i, /GroupProduct/i],
  },
  {
    id: "fin",
    nombre: "Finanzas — CxC y crédito",
    siglaProtheus: "SIGAFIN",
    descripcion: "Clientes, límites de crédito, bloqueos, adjuntos y cobranzas bancarias.",
    paraQueSirve: "Gestiona crédito, historial, análisis VADU, PIX/boletos y tablas financieras.",
    opoEntities: ["Customer", "Invoice"],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "SA1 + endpoints fin/v1 → Customer/Invoice." },
      { sku: "erp.tesoreria", nombre: "Tesorería", comoComplementa: "Cobranzas y conciliación en Clavis." },
      { sku: "com.whatsapp", nombre: "WhatsApp API", comoComplementa: "Recordatorios de cobro desde datos Protheus." },
    ],
    monetizacion: "Bridge + tesorería + canal cobranzas (WhatsApp/SMS).",
    patrones: [/\/api\/fin\//i, /\/api\/gfin\//i, /totvsRecibos/i, /receivables/i],
  },
  {
    id: "ctb",
    nombre: "Contabilidad",
    siglaProtheus: "SIGACTB",
    descripcion: "Asientos, totales, prorrateos y estructura contable.",
    paraQueSirve: "Expone asientos contables, totales, prorrateos y modelos de balance.",
    opoEntities: ["Invoice"],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "SF2/SF1 vía accountingentry." },
      { sku: "erp.contabilidad", nombre: "Contabilidad Clavis", comoComplementa: "Libro diario si migración parcial." },
    ],
    monetizacion: "Pack contador + bridge lectura asientos.",
    patrones: [/\/api\/ctb\//i, /accountingentry/i, /apportionment/i, /accountingtotal/i],
  },
  {
    id: "plan_cuentas",
    nombre: "Plan de cuentas y centros de costo",
    siglaProtheus: "CT1 / CT2",
    descripcion: "Vinculación de cuentas, centros de costo y referencias.",
    paraQueSirve: "Binding chart of accounts, centros de costo y carga CVN.",
    opoEntities: [],
    clavisApps: [
      { sku: "erp.contabilidad", nombre: "Contabilidad Clavis", comoComplementa: "Importa plan de cuentas para mayor contable." },
    ],
    monetizacion: "Implementación parametrización remota (impl.parametrizacion_remota).",
    patrones: [/bindingchartofaccounts/i, /chartofaccount/i, /costcenter/i],
  },
  {
    id: "cc",
    nombre: "Conformidad contable (ECD/ECF)",
    siglaProtheus: "SIGACUS / SPED",
    descripcion: "Validadores ECD/ECF, checklists y asientos extemporáneos.",
    paraQueSirve: "Cumplimiento fiscal contable Brasil; checklists y validadores.",
    opoEntities: [],
    clavisApps: [
      { sku: "erp.contabilidad", nombre: "Contabilidad Clavis", comoComplementa: "Reportes de cierre y conformidad." },
    ],
    monetizacion: "Servicio compliance + horas analista.",
    patrones: [/\/api\/cc\//i, /Ecdvalidators/i, /ecfvalidators/i],
  },
  {
    id: "pc",
    nombre: "Compras",
    siglaProtheus: "SIGACOM",
    descripcion: "Reportes de compras, OC y flujos de aprobación.",
    paraQueSirve: "Genera y descarga reportes PC; integra órdenes de compra.",
    opoEntities: ["Order", "Supplier"],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "SC7/SA2 → Order/Supplier." },
      { sku: "erp.compras", nombre: "Compras Clavis", comoComplementa: "OC y recepción si híbrido." },
    ],
    monetizacion: "Bridge compras + módulo compras Clavis.",
    patrones: [/\/api\/pc\//i, /purchaseorder/i, /\/api\/com\/purchase/i],
  },
  {
    id: "com",
    nombre: "Comercial / distribución",
    siglaProtheus: "SIGAFAT / COM",
    descripcion: "Pedidos comerciales, aprobaciones y flujo de ventas B2B.",
    paraQueSirve: "Órdenes de compra/venta comercial, aprobaciones y catálogo comercial.",
    opoEntities: ["Order", "Customer"],
    clavisApps: [
      { sku: "erp.ventas", nombre: "Ventas Clavis", comoComplementa: "Pedidos y cotizaciones." },
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "SC5 → Order canónico." },
    ],
    monetizacion: "Pack ventas B2B + bridge.",
    patrones: [/\/api\/com\//i, /\/api\/fat\//i],
  },
  {
    id: "ventas",
    nombre: "Ventas TGV / CRM",
    siglaProtheus: "TGV / CRM",
    descripcion: "Presupuestos, pedidos de venta, contactos y CRM.",
    paraQueSirve: "Sales orders, budgets, contacts y pipeline comercial.",
    opoEntities: ["Customer", "Order"],
    clavisApps: [
      { sku: "erp.ventas", nombre: "Ventas Clavis", comoComplementa: "Mini front pedidos y clientes." },
      { sku: "erp.crm", nombre: "CRM", comoComplementa: "Pipeline si activan CRM Clavis." },
    ],
    monetizacion: "CRM + ventas + bridge lectura.",
    patrones: [/\/api\/tgv\//i, /\/api\/crm\//i, /salesorders/i, /salesbudgets/i],
  },
  {
    id: "fiscal",
    nombre: "Fiscal / impuestos",
    siglaProtheus: "TAF / NFe",
    descripcion: "Motor fiscal, NF-e, retenciones y notificaciones centrales.",
    paraQueSirve: "Emisión fiscal, TAF, retenciones y monitoreo EAI fiscal.",
    opoEntities: ["Invoice"],
    clavisApps: [
      { sku: "erp.fiscal", nombre: "Fiscal AFIP Clavis", comoComplementa: "Complementa con CAE/ARBA si migran facturación." },
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Lee comprobantes legacy." },
    ],
    monetizacion: "Servicio fiscal + bridge lectura comprobantes.",
    patrones: [/\/api\/taf\//i, /fiscal/i, /\/api\/fat\//i, /wstaf/i, /nfe/i],
  },
  {
    id: "pcp",
    nombre: "Planificación producción",
    siglaProtheus: "SIGAPCP",
    descripcion: "PCP, órdenes de producción, smartview e inspección de calidad.",
    paraQueSirve: "Planificación, órdenes de fabricación y reportes QIP.",
    opoEntities: ["Product", "Order"],
    clavisApps: [
      { sku: "erp.industria", nombre: "Industria Clavis", comoComplementa: "OP y BOM si migran producción." },
    ],
    monetizacion: "Módulo industria + horas PCP.",
    patrones: [/\/api\/pcp\//i, /processinspection/i, /\/api\/qip\//i],
  },
  {
    id: "rh",
    nombre: "Recursos humanos",
    siglaProtheus: "SIGAPON / eSocial",
    descripcion: "Nómina, préstamos, eSocial y smartview RRHH.",
    paraQueSirve: "Gestión de personal, nómina, eSocial Brasil y reportes RH.",
    opoEntities: [],
    clavisApps: [
      { sku: "erp.rrhh", nombre: "RRHH Clavis", comoComplementa: "Legajos y novedades si unifican." },
    ],
    monetizacion: "Módulo RRHH + integración nómina.",
    patrones: [/\/api\/rh\//i, /\/rh\//i, /esocial/i, /payrollLoan/i],
  },
  {
    id: "retail",
    nombre: "Retail / POS",
    siglaProtheus: "SIGALOJA",
    descripcion: "Punto de venta retail y operaciones de tienda.",
    paraQueSirve: "Integración retail, POS y operaciones de sucursal.",
    opoEntities: ["Product", "Customer", "Invoice"],
    clavisApps: [
      { sku: "erp.pos", nombre: "POS Clavis", comoComplementa: "POS moderno leyendo catálogo Protheus." },
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Catálogo y clientes legacy." },
    ],
    monetizacion: "POS Clavis + bridge catálogo.",
    patrones: [/\/api\/retail\//i],
  },
  {
    id: "framework",
    nombre: "Framework TOTVS",
    siglaProtheus: "FW",
    descripcion: "Usuarios, privilegios, providers y utilitarios del AppServer.",
    paraQueSirve: "Autenticación, permisos, usuarios AC y data providers genéricos.",
    opoEntities: [],
    clavisApps: [
      { sku: "sec.mfa", nombre: "MFA", comoComplementa: "Refuerzo auth si SSO Clavis." },
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "acUser para mapeo usuarios." },
    ],
    monetizacion: "Seguridad + bridge identidad.",
    patrones: [/\/api\/framework\//i, /\/api\/v1\/acUser/i, /dbdataproviders/i, /privileges/i],
  },
  {
    id: "analytics",
    nombre: "Business Analytics",
    siglaProtheus: "BA / Insights",
    descripcion: "Alertas, insights y monitoreo EAI.",
    paraQueSirve: "Alertas de negocio y monitoreo de integraciones.",
    opoEntities: [],
    clavisApps: [
      { sku: "bi.reportes", nombre: "Reportes BI Clavis", comoComplementa: "Dashboards sobre datos OPO." },
      { sku: "infra.uptime", nombre: "Uptime", comoComplementa: "Monitoreo del REST Protheus." },
    ],
    monetizacion: "Pack BI + monitoreo uptime del AppServer.",
    patrones: [/\/api\/ba\//i, /totvseai/i, /monitor/i, /insights/i],
  },
  {
    id: "health",
    nombre: "Plan de salud (TOTVS Health)",
    siglaProtheus: "Health Plans",
    descripcion: "Beneficiarios, contratos familiares y atención.",
    paraQueSirve: "Vertical salud: planes, beneficiarios y red de atención.",
    opoEntities: ["Customer"],
    clavisApps: [
      { sku: "erp.salud", nombre: "Salud Clavis", comoComplementa: "Agenda y pacientes si vertical salud." },
    ],
    monetizacion: "Vertical salud + bridge.",
    patrones: [/totvsHealthPlans/i, /healthplans/i],
  },
  {
    id: "usuarios",
    nombre: "Usuarios y acceso",
    siglaProtheus: "AC User",
    descripcion: "Usuarios del sistema y perfiles.",
    paraQueSirve: "CRUD de usuarios Protheus para SSO o mapeo Clavis.",
    opoEntities: [],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Sincroniza usuarios legacy." },
    ],
    monetizacion: "Incluido en bridge + MFA opcional.",
    patrones: [/\/api\/v1\/acUser/i, /\/user/i],
  },
  {
    id: "otros",
    nombre: "Otros / específicos cliente",
    siglaProtheus: "Custom AdvPL",
    descripcion: "Endpoints custom, integraciones EAI y rutinas particulares del cliente.",
    paraQueSirve: "Rutinas desarrolladas a medida; requieren análisis por analista.",
    opoEntities: [],
    clavisApps: [
      { sku: "bridge.opo_studio", nombre: "OPO Studio Bridge", comoComplementa: "Mapeo manual en Legacy Bridge wizard." },
      { sku: "impl.parametrizacion_remota", nombre: "Parametrización remota", comoComplementa: "Horas analista para documentar custom." },
    ],
    monetizacion: "Horas consultoría + bridge custom.",
    patrones: [],
  },
]

export function classifyProtheusEndpoint(endpoint: string): string {
  for (const mod of PROTHEUS_MODULE_REGISTRY) {
    if (mod.id === "otros") continue
    if (mod.patrones.some((p) => p.test(endpoint))) return mod.id
  }
  return "otros"
}

export function getModuleMeta(moduleId: string): ProtheusModuleMeta {
  return PROTHEUS_MODULE_REGISTRY.find((m) => m.id === moduleId) ?? PROTHEUS_MODULE_REGISTRY.find((m) => m.id === "otros")!
}

export function inferEndpointPurpose(endpoint: string, method: string): string {
  const ep = endpoint.toLowerCase()
  const verbs: Record<string, string> = {
    GET: "Consulta",
    POST: "Alta/proceso",
    PUT: "Actualización",
    PATCH: "Actualización parcial",
    DELETE: "Baja",
  }
  const verb = verbs[method] ?? method

  if (ep.includes("customer")) return `${verb} de clientes (maestro SA1 / finanzas)`
  if (ep.includes("product")) return `${verb} de productos (maestro SB1)`
  if (ep.includes("supplier") || ep.includes("vendor")) return `${verb} de proveedores (SA2)`
  if (ep.includes("salesorder") || ep.includes("order")) return `${verb} de pedidos (SC5/SC6)`
  if (ep.includes("invoice") || ep.includes("accountingentry")) return `${verb} de comprobantes/asientos`
  if (ep.includes("warehouse") || ep.includes("stock")) return `${verb} de inventario/depósitos`
  if (ep.includes("credit")) return `${verb} de límite de crédito cliente`
  if (ep.includes("report") || ep.includes("download")) return `${verb} de reportes`
  if (ep.includes("attachment")) return `${verb} de adjuntos`
  if (ep.includes("profile") || ep.includes("config")) return `${verb} de configuración/perfil`
  if (ep.includes("privilege") || ep.includes("acuser")) return `${verb} de usuarios/permisos`
  if (ep.includes("payroll") || ep.includes("rh")) return `${verb} de recursos humanos/nómina`
  if (ep.includes("fiscal") || ep.includes("taf")) return `${verb} fiscal/impuestos`
  if (ep.includes("purchase")) return `${verb} de compras/OC`
  if (ep.includes("kardex") || ep.includes("trackcost")) return `${verb} de kardex/costos`
  if (ep.includes("checklist") || ep.includes("validator")) return `${verb} de validación/conformidad`
  if (ep.includes(":id")) return `${verb} por identificador (recurso individual)`
  return `${verb} — endpoint Protheus (revisar con analista)`
}