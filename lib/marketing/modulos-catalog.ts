import type { LucideIcon } from "lucide-react"
import {
  Store,
  Receipt,
  Package,
  ShoppingCart,
  Wallet,
  BookOpen,
  FileText,
  Globe,
  Truck,
  Factory,
  Layers,
  ScanLine,
  Cpu,
  Bot,
  Target,
  UserCircle,
  GraduationCap,
  UtensilsCrossed,
  CreditCard,
  Zap,
  BarChart3,
} from "lucide-react"

export interface ModuloCategoria {
  id: string
  label: string
  tagline: string
  color: string
  gradient: string
  icon: LucideIcon
  highlights: string[]
  badge?: string
}

export const MODULO_STATS = [
  { value: 40, suffix: "+", label: "Módulos integrados" },
  { value: 14, suffix: "", label: "Rubros con onboarding IA" },
  { value: 1, suffix: "", label: "Stock unificado multi-canal" },
  { value: 100, suffix: "%", label: "Pensado para Argentina" },
] as const

export const MODULO_CATEGORIAS: ModuloCategoria[] = [
  {
    id: "ventas",
    label: "Ventas & POS",
    tagline: "Mostrador, facturación y cierre de turno sin fricción.",
    color: "text-emerald-600",
    gradient: "from-emerald-500/20 to-teal-500/10",
    icon: Store,
    badge: "Core",
    highlights: [
      "POS táctil con atajos F-key y modo foco",
      "Factura electrónica AFIP con CAE y CAEA",
      "Presupuestos, pedidos y listas de precio",
      "Motor de precios automático por cliente y canal",
      "Cierre X/Z y arqueo de caja integrado",
    ],
  },
  {
    id: "stock",
    label: "Stock & Depósito",
    tagline: "Inventario real, transferencias y trazabilidad.",
    color: "text-blue-600",
    gradient: "from-blue-500/20 to-cyan-500/10",
    icon: Package,
    badge: "Core",
    highlights: [
      "Productos, categorías y múltiples depósitos",
      "Inventario, ajustes y movimientos auditados",
      "Transferencias entre sucursales",
      "Alertas de stock crítico y backorder",
      "Picking con modo tablet para operarios",
    ],
  },
  {
    id: "compras",
    label: "Compras",
    tagline: "Del proveedor al depósito, todo registrado.",
    color: "text-orange-600",
    gradient: "from-orange-500/20 to-amber-500/10",
    icon: ShoppingCart,
    highlights: [
      "Facturas de compra y órdenes",
      "Maestro de proveedores",
      "Remitos de entrada y recepción",
      "Cuentas a pagar vinculadas",
      "Aprobaciones de compras por monto",
    ],
  },
  {
    id: "financiero",
    label: "Financiero",
    tagline: "Caja, banco y tesorería en un solo tablero.",
    color: "text-violet-600",
    gradient: "from-violet-500/20 to-purple-500/10",
    icon: Wallet,
    highlights: [
      "Caja diaria con arqueo y medios de pago",
      "Banco, cheques y conciliación",
      "Cuentas a cobrar y a pagar",
      "Flujo de fondos y presupuesto",
      "Mercado Pago integrado",
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    tagline: "Asientos, balances y cierre fiscal ordenado.",
    color: "text-cyan-600",
    gradient: "from-cyan-500/20 to-sky-500/10",
    icon: BookOpen,
    highlights: [
      "Plan de cuentas y asientos contables",
      "Balances y períodos fiscales",
      "Activos fijos y amortizaciones",
      "Centros de costo",
      "Ajuste por inflación",
    ],
  },
  {
    id: "fiscal",
    label: "Fiscal / AFIP",
    tagline: "IVA, IIBB y presentaciones sin salir del ERP.",
    color: "text-red-600",
    gradient: "from-red-500/20 to-rose-500/10",
    icon: FileText,
    badge: "Argentina",
    highlights: [
      "Libros IVA ventas y compras",
      "Ingresos Brutos y padrón",
      "Presentación AFIP y CITI",
      "Puntos de venta y series",
      "MiPyME FCE y contingencia CAEA",
    ],
  },
  {
    id: "canales",
    label: "Ecommerce & Canales",
    tagline: "Tienda online, portal B2B y marketplaces conectados.",
    color: "text-teal-600",
    gradient: "from-teal-500/20 to-emerald-500/10",
    icon: Globe,
    badge: "Destacado",
    highlights: [
      "Tienda B2C con stock en tiempo real",
      "Portal mayorista con login por CUIT",
      "Checkout → picking → remito → factura",
      "Mercado Libre y Mercado Pago",
      "WhatsApp para confirmación de pedidos",
    ],
  },
  {
    id: "logistica",
    label: "Logística & Distribución",
    tagline: "Del depósito a la puerta del cliente.",
    color: "text-emerald-600",
    gradient: "from-emerald-600/20 to-lime-500/10",
    icon: Truck,
    highlights: [
      "Envíos y transportistas",
      "Hojas de ruta con paradas ordenadas",
      "POD con firma, foto y geolocalización",
      "App vendedor en ruta (offline)",
      "Distribución y reintentos de entrega",
    ],
  },
  {
    id: "industria",
    label: "Industria & Producción",
    tagline: "BOM, MRP y calidad para fabricantes.",
    color: "text-orange-700",
    gradient: "from-orange-600/20 to-yellow-500/10",
    icon: Factory,
    highlights: [
      "Órdenes de producción",
      "Lista de materiales (BOM)",
      "MRP — planificación de requerimientos",
      "Control de calidad e inspecciones",
      "Mantenimiento preventivo",
    ],
  },
  {
    id: "agro",
    label: "Agro / Acopio",
    tagline: "Cereales, balanza, liquidaciones y campo.",
    color: "text-lime-700",
    gradient: "from-lime-600/20 to-green-500/10",
    icon: Layers,
    highlights: [
      "Balanza de camiones digital",
      "Contratos y pizarra BCR/Chicago",
      "Liquidaciones con retenciones",
      "Carta de porte (CPE)",
      "IoT agrícola: sensores, riego, maquinaria",
    ],
  },
  {
    id: "rubro",
    label: "Servicios por Rubro",
    tagline: "Hospitalidad, salud, belleza y más.",
    color: "text-pink-600",
    gradient: "from-pink-500/20 to-fuchsia-500/10",
    icon: UtensilsCrossed,
    highlights: [
      "Mesas, comandas y KDS de cocina",
      "Agenda de turnos y peluquería móvil",
      "Historia clínica y veterinaria",
      "Membresías para gimnasios",
      "Recetas y costos por plato",
    ],
  },
  {
    id: "comercial",
    label: "Gestión Comercial",
    tagline: "CRM, KPIs y aprobaciones en tiempo real.",
    color: "text-rose-600",
    gradient: "from-rose-500/20 to-red-500/10",
    icon: Target,
    highlights: [
      "CRM con pipeline de oportunidades",
      "Tablero de KPIs ejecutivos",
      "Aprobaciones de descuentos y NC",
      "Alertas configurables por rol",
      "Dashboard por rol (cajero, dueño, contador)",
    ],
  },
  {
    id: "rrhh",
    label: "RRHH",
    tagline: "Legajos y liquidación de sueldos.",
    color: "text-lime-600",
    gradient: "from-lime-500/20 to-emerald-500/10",
    icon: UserCircle,
    highlights: [
      "Empleados y legajos digitales",
      "Liquidación de sueldos",
      "Integración contable de nómina",
      "Roles y permisos por módulo",
    ],
  },
  {
    id: "iot",
    label: "IoT & Automatización",
    tagline: "Sensores, alertas y flujos sin código.",
    color: "text-sky-600",
    gradient: "from-sky-500/20 to-blue-500/10",
    icon: Cpu,
    highlights: [
      "Centro IoT con telemetría",
      "Alertas por umbrales",
      "Automation Hub + n8n",
      "Playbooks y empleados virtuales",
      "Webhooks inbound/outbound",
    ],
  },
  {
    id: "ia",
    label: "Inteligencia Artificial",
    tagline: "Onboarding, agentes y operaciones asistidas.",
    color: "text-purple-600",
    gradient: "from-purple-500/20 to-violet-500/10",
    icon: Bot,
    badge: "IA",
    highlights: [
      "Onboarding IA por rubro en 5 minutos",
      "Asistente conversacional en el ERP",
      "Morning Commander — agentes de operaciones",
      "Alertas inteligentes por rol",
      "Configuración automática de módulos",
    ],
  },
  {
    id: "capacitacion",
    label: "Capacitación & Soporte",
    tagline: "Documentación, diagnóstico y tickets.",
    color: "text-indigo-600",
    gradient: "from-indigo-500/20 to-blue-500/10",
    icon: GraduationCap,
    highlights: [
      "Centro de capacitación integrado",
      "Manual de usuario por módulo",
      "Diagnóstico de gaps de implementación",
      "Soporte con tickets",
      "Documentación técnica embebida",
    ],
  },
]

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 29900,
    description: "Para comercios que arrancan con POS y facturación.",
    features: [
      "POS + factura electrónica AFIP",
      "Hasta 3 usuarios",
      "Stock básico (1 depósito)",
      "Caja y clientes",
      "Soporte por email",
    ],
    cta: "Probar gratis",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49900,
    description: "Operación completa con canales y reportes.",
    features: [
      "Todo Starter + compras y CC",
      "Hasta 10 usuarios",
      "Tienda online o portal B2B",
      "Onboarding IA por rubro",
      "KPIs y alertas por rol",
      "Soporte prioritario",
    ],
    cta: "Probar gratis",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 89900,
    description: "Multi-sucursal, industria, agro o logística avanzada.",
    features: [
      "Usuarios ilimitados",
      "Multi-depósito y distribución",
      "Industria, agro o IoT",
      "Automation Hub + IA avanzada",
      "Implementación asistida",
      "SLA dedicado",
    ],
    cta: "Hablar con ventas",
    highlighted: false,
  },
] as const

export const ADDONS = [
  { name: "Mercado Pago", price: 9900, icon: CreditCard },
  { name: "Mercado Libre", price: 14900, icon: Globe },
  { name: "WhatsApp Business", price: 7900, icon: Zap },
  { name: "Automation Hub", price: 29900, icon: Cpu },
  { name: "Morning Commander IA", price: 19900, icon: Bot },
] as const

export const RUBROS = [
  { emoji: "💅", label: "Salón de belleza" },
  { emoji: "🍕", label: "Bar / Restaurant" },
  { emoji: "🛒", label: "Kiosco / Almacén" },
  { emoji: "🔧", label: "Ferretería" },
  { emoji: "🚚", label: "Distribuidora" },
  { emoji: "💊", label: "Farmacia" },
  { emoji: "🐾", label: "Veterinaria" },
  { emoji: "🏥", label: "Clínica / Salud" },
  { emoji: "🏋️", label: "Gimnasio" },
  { emoji: "🏭", label: "Industria" },
  { emoji: "🌾", label: "Acopio / Agro" },
  { emoji: "👕", label: "Indumentaria" },
  { emoji: "📚", label: "Librería" },
  { emoji: "⛽", label: "Estación de servicio" },
] as const

export const FAQ_ITEMS = [
  {
    q: "¿Es un ERP completo o solo un POS?",
    a: "Es un ERP integral con POS incluido. Ventas, stock, compras, caja, contabilidad, impuestos AFIP y módulos verticales por rubro — todo en una sola plataforma multi-tenant.",
  },
  {
    q: "¿Puedo activar solo los módulos que necesito?",
    a: "Sí. El onboarding IA y la configuración por rubro activan automáticamente los módulos relevantes y ocultan el resto. Pagás por plan, no por cada pantalla.",
  },
  {
    q: "¿Funciona la facturación electrónica AFIP?",
    a: "Sí. Homologación y producción, puntos de venta, CAE, CAEA para contingencia offline y soporte MiPyME FCE. El certificado se carga desde configuración.",
  },
  {
    q: "¿Tiene tienda online y portal para mayoristas?",
    a: "Sí. Tienda B2C pública en /tienda y portal B2B con login por CUIT en /portal. Ambos comparten stock y motor de precios con el POS.",
  },
  {
    q: "¿Cuánto tarda implementar?",
    a: "Con onboarding IA podés operar en el mismo día para rubros simples. Implementaciones con AFIP producción, migración de datos o logística avanzada: 1 a 3 semanas.",
  },
  {
    q: "¿Hay demo para probar?",
    a: "Sí. Entrá a Probar demo desde esta página o usá /login con acceso demo por rubro. También podés ver la tienda en /tienda?empresaId=1.",
  },
] as const

export const NAV_SECTIONS = [
  { id: "modulos", label: "Módulos" },
  { id: "canales", label: "Ecommerce" },
  { id: "flujo", label: "Flujo" },
  { id: "rubros", label: "Rubros" },
  { id: "precios", label: "Precios" },
  { id: "faq", label: "FAQ" },
] as const

export const FLOW_STEPS = [
  { icon: Globe, label: "Cliente compra", sub: "Web, POS o ML" },
  { icon: Receipt, label: "Pedido confirmado", sub: "Reserva stock" },
  { icon: ScanLine, label: "Picking", sub: "Depósito" },
  { icon: Truck, label: "Envío / ruta", sub: "POD" },
  { icon: FileText, label: "Factura AFIP", sub: "CAE automático" },
  { icon: BarChart3, label: "Cobro y KPI", sub: "Tiempo real" },
] as const