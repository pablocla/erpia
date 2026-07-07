import type { LucideIcon } from "lucide-react"
import {
  Calculator,
  FileText,
  Layers,
  Package,
  Store,
  Users,
} from "lucide-react"

export interface ClaverpFeatureBlock {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: { title: string; text: string }[]
  cta: { label: string; href: string }
  variant: "light" | "dark"
  visual: "invoicing" | "treasury" | "stock" | "crm" | "industry"
}

export interface ClaverpPlatformModule {
  id: string
  name: string
  description: string
  icon: LucideIcon
  href: string
}

export interface ClaverpValueProp {
  title: string
  description: string
}

export const CLAVERP_PLATFORM_MODULES: ClaverpPlatformModule[] = [
  {
    id: "afip",
    name: "Facturación AFIP",
    description: "CAE, libros IVA y comprobantes electrónicos desde el POS o backoffice.",
    icon: FileText,
    href: "/claver/claverp/modulos#fiscal",
  },
  {
    id: "pos",
    name: "Caja & POS",
    description: "Mostrador táctil, arqueos, medios de pago y cierre de turno.",
    icon: Store,
    href: "/claver/claverp/modulos#ventas",
  },
  {
    id: "stock",
    name: "Stock & depósitos",
    description: "Inventario multi-depósito, alertas y trazabilidad en tiempo real.",
    icon: Package,
    href: "/claver/claverp/modulos#stock",
  },
  {
    id: "contabilidad",
    name: "Contabilidad",
    description: "Asientos automáticos, balances e informes para tu estudio.",
    icon: Calculator,
    href: "/claver/claverp/modulos#contabilidad",
  },
  {
    id: "crm",
    name: "Clientes & CRM",
    description: "Cuentas corrientes, fiado, historial y segmentación.",
    icon: Users,
    href: "/claver/claverp/modulos#comercial",
  },
  {
    id: "rubros",
    name: "Rubros & nichos",
    description: "Gimnasio, veterinaria, taller, club y más — demo en 10 segundos.",
    icon: Layers,
    href: "/demo",
  },
]

export const CLAVERP_FEATURE_BLOCKS: ClaverpFeatureBlock[] = [
  {
    id: "facturacion",
    eyebrow: "Facturación",
    title: "AFIP resuelto, sin estrés de fin de mes",
    description:
      "Emití facturas A/B/C, notas de crédito y libros IVA desde el mismo flujo de venta. Sin exportar a otro sistema ni reingresar datos.",
    bullets: [
      { title: "Imagen profesional", text: "Comprobantes con tu marca y CAE al instante." },
      { title: "Documentos en segundos", text: "POS, masivo o remito → factura en un clic." },
    ],
    cta: { label: "Ver facturación AFIP", href: "/claver/claverp/modulos#fiscal" },
    variant: "dark",
    visual: "invoicing",
  },
  {
    id: "tesoreria",
    eyebrow: "Caja & tesorería",
    title: "Visibilidad total de tu flujo de caja",
    description:
      "Arqueos de caja, medios de pago, banco y previsión de cobros. Sabés cuánto tenés hoy y qué entra mañana.",
    bullets: [
      { title: "Cierre de turno", text: "Arqueo por cajero con diferencias y auditoría." },
      { title: "Fiado bajo control", text: "Libreta digital con alertas de mora y límites." },
    ],
    cta: { label: "Probar demo almacén", href: "/demo/almacen" },
    variant: "light",
    visual: "treasury",
  },
  {
    id: "stock",
    eyebrow: "Inventario",
    title: "Stock que se actualiza con cada venta",
    description:
      "Depósitos, picking, compras y alertas de quiebre. Un solo stock para mostrador, ecommerce y reparto.",
    bullets: [
      { title: "Multi-depósito", text: "Transferencias y stock por sucursal." },
      { title: "Alertas inteligentes", text: "Reposición antes de perder la venta." },
    ],
    cta: { label: "Explorar módulo stock", href: "/claver/claverp/modulos#stock" },
    variant: "light",
    visual: "stock",
  },
  {
    id: "crm",
    eyebrow: "Clientes",
    title: "De la oportunidad a la factura",
    description:
      "Ficha de cliente, cuenta corriente, fiado y historial de compras. Tu equipo vende con contexto, no con Excel.",
    bullets: [
      { title: "Cierra y factura al instante", text: "Presupuesto → venta → CAE sin salir del ERP." },
      { title: "Una sola fuente de verdad", text: "Clientes, precios y saldos sincronizados." },
    ],
    cta: { label: "Ver módulos comerciales", href: "/claver/claverp/modulos#comercial" },
    variant: "dark",
    visual: "crm",
  },
  {
    id: "rubros",
    eyebrow: "Tu rubro",
    title: "El sistema que habla el idioma de tu negocio",
    description:
      "Elegí gimnasio, carnicería, veterinaria o almacén: armamos una demo aislada con módulos y datos de tu industria.",
    bullets: [
      { title: "Demo en 10 segundos", text: "Tenant aislado, sin tarjeta ni configuración." },
      { title: "Solo lo que necesitás", text: "Activá nichos desde el marketplace cuando crezcas." },
    ],
    cta: { label: "Elegir demo por rubro", href: "/demo" },
    variant: "light",
    visual: "industry",
  },
]

export const CLAVERP_VALUE_PROPS: ClaverpValueProp[] = [
  {
    title: "El setup más rápido del rubro",
    description: "Demo por industria con datos reales. Empezá a navegar en menos de un minuto.",
  },
  {
    title: "Cumplimiento donde importa",
    description: "AFIP, IVA, IIBB y libros fiscales pensados para Argentina — no adaptaciones europeas.",
  },
  {
    title: "Multisucursal por defecto",
    description: "Depósitos, cajas y permisos por sucursal sin contratar otro producto.",
  },
  {
    title: "Fiado y cuenta corriente",
    description: "Libreta digital con límites, mora y cobranza — ideal para almacenes de barrio.",
  },
  {
    title: "Marketplace modular",
    description: "Pagá solo los módulos que usás. Escalá de POS a logística o industria.",
  },
  {
    title: "Integraciones argentinas",
    description: "Mercado Pago, AFIP, WhatsApp y automatización sin depender de zapier frágil.",
  },
]

export const CLAVERP_ADVISOR_BLOCK = {
  eyebrow: "Para estudios contables",
  title: "¿Sos contador? Claver también es para vos",
  description:
    "Gestioná múltiples clientes con datos aislados, libros IVA exportables y acceso de solo lectura para tu equipo.",
  bullets: [
    "Libro IVA ventas y compras",
    "Multi-empresa con permisos",
    "Reportes para cierre mensual",
  ],
  cta: { label: "Hablar con implementación", href: "/claver/contacto" },
  secondary: { label: "Claver Cloud", href: "/claver-cloud" },
}