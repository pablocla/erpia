/**
 * Helper centralizado para triggers de cobro (disparo / consumo / escala).
 * Define qué es gratis (pantalla + CPU) y qué exige activar un extra o plan.
 * Fuente canónica: docs/comercial/PLAN_SUBIR_TRANSVERSAL_GRATIS.md
 */

export type DisparoKey =
  | "whatsapp_outbound"
  | "sena_link_mp"
  | "factura_afip"
  | "segunda_caja"
  | "tercer_usuario"
  | "reportes_historicos"

export interface DisparoConfig {
  key: DisparoKey
  skuRequerido: string
  skusValidos: string[]
  titulo: string
  descripcion: string
  aclaracionGratis: string
  ctaLabel: string
  checkoutHref: string
  /** checkout = ir a facturación; pactar-implementacion = turno tipo Calendly en Cloud */
  ctaModo?: "checkout" | "pactar-implementacion"
}

export const DISPAROS_CONFIG: Record<DisparoKey, DisparoConfig> = {
  whatsapp_outbound: {
    key: "whatsapp_outbound",
    skuRequerido: "intang.cobranzas_wa",
    skusValidos: ["intang.cobranzas_wa", "com.whatsapp", "channel.whatsapp", "core.claver"],
    titulo: "Pactar WhatsApp de cobro",
    descripcion:
      "El envío automático por WhatsApp se pacta con el equipo que también emite el certificado ARCA. Mientras tanto, anotá deudas y cobrá en pantalla.",
    aclaracionGratis: "Ver quién te debe y anotar fiados en pantalla sigue siendo 100% gratis.",
    ctaLabel: "Pactar implementación",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=intang.cobranzas_wa",
    ctaModo: "pactar-implementacion",
  },
  sena_link_mp: {
    key: "sena_link_mp",
    skuRequerido: "fiscal.clavpay_link",
    skusValidos: ["fiscal.clavpay_link", "svc.cobranza_as_a_service", "core.claver"],
    titulo: "Activar link de cobro digital para señas",
    descripcion: "Para que tus clientes paguen la seña con tarjeta o Mercado Pago directo desde el link, activá ClavPay.",
    aclaracionGratis: "Crear presupuestos y anotar señas cobradas en efectivo o transferencia es 100% gratis.",
    ctaLabel: "Activar Cobro Online",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=fiscal.clavpay_link",
  },
  factura_afip: {
    key: "factura_afip",
    skuRequerido: "fiscal.cert_afip",
    skusValidos: ["fiscal.cert_afip", "core.claver"],
    titulo: "Pactar certificado ARCA / factura electrónica",
    descripcion:
      "Para emitir Factura A, B o C con CAE hace falta el certificado de quien tenga acceso a ARCA. Lo agendamos con un turno. Mientras tanto, vendé y emití ticket interno sin CAE.",
    aclaracionGratis: "El ticket interno y la venta en caja son gratis, sin factura electrónica.",
    ctaLabel: "Pactar certificado ARCA",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=fiscal.cert_afip",
    ctaModo: "pactar-implementacion",
  },
  segunda_caja: {
    key: "segunda_caja",
    skuRequerido: "pos.segunda_caja",
    skusValidos: ["pos.segunda_caja", "core.claver"],
    titulo: "Segunda caja simultánea",
    descripcion: "Abrir dos o más cajas en paralelo para múltiples mostradores o sucursales requiere el pack multi-caja.",
    aclaracionGratis: "1 caja mostrador con apertura, cierre y arqueo ciego es gratis para siempre.",
    ctaLabel: "Sumar 2ª Caja",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=pos.segunda_caja",
  },
  tercer_usuario: {
    key: "tercer_usuario",
    skuRequerido: "team.usuario_adicional",
    skusValidos: ["team.usuario_adicional", "core.claver"],
    titulo: "Límite de usuarios del plan gratuito",
    descripcion: "El plan gratuito incluye hasta 2 usuarios activos (Dueño + 1 Cajero/Vendedor). Para sumar más personal, activá el pack equipo.",
    aclaracionGratis: "Tus primeros 2 usuarios pueden operar sin vencimiento ni costo.",
    ctaLabel: "Activar Pack Equipo",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=team.usuario_adicional",
  },
  reportes_historicos: {
    key: "reportes_historicos",
    skuRequerido: "data.reportes_prog",
    skusValidos: ["data.reportes_prog", "core.claver"],
    titulo: "Reportes históricos avanzados",
    descripcion: "Consultar métricas, balance y exportar a Excel rangos mayores a 48 horas requiere el módulo de reportes avanzados.",
    aclaracionGratis: "Las métricas de ventas y cierres de hoy y ayer son 100% gratuitas.",
    ctaLabel: "Activar Reportes Avanzados",
    checkoutHref: "/dashboard/facturacion-recurrente?activar=data.reportes_prog",
  },
}

export function tieneDisparoHabilitado(disparoKey: DisparoKey, skusActivos: string[]): boolean {
  const config = DISPAROS_CONFIG[disparoKey]
  if (!config) return false
  return config.skusValidos.some((sku) => skusActivos.includes(sku))
}
