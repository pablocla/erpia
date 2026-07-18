import {
  BookOpen,
  Calendar,
  CreditCard,
  MessageSquare,
  MoreHorizontal,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { type SubSaasSlug, SUB_SAAS_APPS } from "./sub-saas-catalog"
import type { ModoLite } from "./pack-calle-catalog"

export interface ProductShellTab {
  href: string
  icon: LucideIcon
  label: string
}

export type ProductKpiFormat = "currency" | "number" | "text"

export interface ProductShellKpiDef {
  id: string
  label: string
  icon: LucideIcon
  format: ProductKpiFormat
  href?: string
}

export interface ProductShellConfig {
  slug: SubSaasSlug
  marca: string
  icono: LucideIcon
  tabs: ProductShellTab[]
  kpis: ProductShellKpiDef[]
  primaryAction: { label: string; href: string }
}

const DEFAULT_MORE_TAB: ProductShellTab = { href: "#more", icon: MoreHorizontal, label: "Más" }

const MODO_LITE_DEFAULT_SLUG: Partial<Record<ModoLite, SubSaasSlug>> = {
  fiado: "fiado",
  cobranza: "cobra",
  pos: "pos",
  niche: "turnos",
  servicios: "monotributo",
}

export const PRODUCT_SHELLS: Record<SubSaasSlug, ProductShellConfig> = {
  pos: {
    slug: "pos",
    marca: "Claver POS",
    icono: ShoppingBag,
    tabs: [
      { href: "/dashboard/pos", icon: ShoppingBag, label: "Mostrador" },
      { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
      { href: "/dashboard/productos", icon: Package, label: "Productos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/fiado", icon: BookOpen, label: "Fiado" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "ventas_hoy", label: "Ventas hoy", icon: Wallet, format: "currency", href: "/dashboard/pos" },
      { id: "tickets", label: "Tickets", icon: ShoppingBag, format: "number" },
      { id: "stock_bajo", label: "Stock bajo", icon: Package, format: "number", href: "/dashboard/productos" },
      { id: "caja", label: "Caja", icon: Wallet, format: "text", href: "/dashboard/caja" },
    ],
    primaryAction: { label: "Abrir POS", href: "/dashboard/pos" },
  },
  fiado: {
    slug: "fiado",
    marca: "Claver Fiado",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/fiado", icon: BookOpen, label: "Libreta" },
      { href: "/dashboard/pos", icon: ShoppingBag, label: "Mostrador" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "saldo_total", label: "Deuda total", icon: Wallet, format: "currency", href: "/dashboard/fiado" },
      { id: "deudores", label: "Con deuda", icon: Users, format: "number", href: "/dashboard/fiado" },
      { id: "fiados_hoy", label: "Fiados hoy", icon: BookOpen, format: "number" },
      { id: "avisos_hoy", label: "Avisos hoy", icon: MessageSquare, format: "number" },
    ],
    primaryAction: { label: "Anotar fiado", href: "/dashboard/fiado" },
  },
  cobra: {
    slug: "cobra",
    marca: "Claver Cobrá",
    icono: CreditCard,
    tabs: [
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "recuperable", label: "Recuperable", icon: Wallet, format: "currency", href: "/dashboard/cuentas-cobrar" },
      { id: "morosos", label: "Cuentas vencidas", icon: Users, format: "number" },
      { id: "contactables", label: "Con WhatsApp", icon: MessageSquare, format: "number" },
      { id: "clientes", label: "Clientes únicos", icon: Users, format: "number" },
    ],
    primaryAction: { label: "Ver morosos", href: "/dashboard/cuentas-cobrar" },
  },
  turnos: {
    slug: "turnos",
    marca: "Claver Turnos",
    icono: Calendar,
    tabs: [
      { href: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "turnos_hoy", label: "Turnos hoy", icon: Calendar, format: "number", href: "/dashboard/agenda" },
      { id: "pendientes", label: "Pendientes", icon: Users, format: "number" },
      { id: "link_publico", label: "Link público", icon: MessageSquare, format: "text" },
      { id: "profesionales", label: "Profesionales", icon: Users, format: "number" },
    ],
    primaryAction: { label: "Nuevo turno", href: "/dashboard/agenda" },
  },
  tienda: {
    slug: "tienda",
    marca: "Claver Tienda",
    icono: ShoppingBag,
    tabs: [
      { href: "/dashboard/ecommerce", icon: ShoppingBag, label: "Tienda" },
      { href: "/dashboard/productos", icon: Package, label: "Productos" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "productos", label: "Productos online", icon: Package, format: "number", href: "/dashboard/productos" },
      { id: "link_tienda", label: "Tu tienda", icon: ShoppingBag, format: "text", href: "/dashboard/ecommerce" },
      { id: "pedidos", label: "Pedidos", icon: ShoppingBag, format: "number" },
      { id: "stock", label: "Con stock", icon: Package, format: "number" },
    ],
    primaryAction: { label: "Configurar tienda", href: "/dashboard/ecommerce" },
  },
  presupuestos: {
    slug: "presupuestos",
    marca: "Claver Presupuestos",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/ventas/presupuestos", icon: BookOpen, label: "Presupuestos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "borradores", label: "Borradores", icon: BookOpen, format: "number" },
      { id: "enviados", label: "Enviados", icon: MessageSquare, format: "number" },
      { id: "aceptados", label: "Aceptados", icon: Users, format: "number" },
      { id: "mes", label: "Este mes", icon: Calendar, format: "number" },
    ],
    primaryAction: { label: "Nuevo presupuesto", href: "/dashboard/ventas/presupuestos" },
  },
  "menu-qr": {
    slug: "menu-qr",
    marca: "Claver Menú",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/hospitalidad/platos", icon: BookOpen, label: "Carta" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "platos", label: "Platos activos", icon: BookOpen, format: "number" },
      { id: "link_menu", label: "Menú QR", icon: MessageSquare, format: "text" },
      { id: "categorias", label: "Categorías", icon: Package, format: "number" },
      { id: "precio_prom", label: "Precio prom.", icon: Wallet, format: "currency" },
    ],
    primaryAction: { label: "Editar carta", href: "/dashboard/hospitalidad/platos" },
  },
  "contenido-ia": {
    slug: "contenido-ia",
    marca: "Claver Contenido",
    icono: MessageSquare,
    tabs: [
      { href: "/dashboard/apps", icon: MessageSquare, label: "Contenido" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "grillas", label: "Grillas", icon: BookOpen, format: "number" },
      { id: "posts", label: "Posts generados", icon: MessageSquare, format: "number" },
      { id: "rubro", label: "Rubro", icon: Users, format: "text" },
      { id: "mes", label: "Mes actual", icon: Calendar, format: "text" },
    ],
    primaryAction: { label: "Generar grilla", href: "/dashboard/apps" },
  },
  "bot-wa": {
    slug: "bot-wa",
    marca: "Claver Bot",
    icono: MessageSquare,
    tabs: [
      { href: "/dashboard/configuracion", icon: Settings, label: "WhatsApp" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "plantillas", label: "Plantillas", icon: MessageSquare, format: "number" },
      { id: "pendientes", label: "Sin responder", icon: Users, format: "number" },
      { id: "hoy", label: "Mensajes hoy", icon: Calendar, format: "number" },
      { id: "estado", label: "Canal", icon: CreditCard, format: "text" },
    ],
    primaryAction: { label: "Configurar bot", href: "/dashboard/configuracion" },
  },
  stock: {
    slug: "stock",
    marca: "Claver Stock",
    icono: Package,
    tabs: [
      { href: "/dashboard/productos", icon: Package, label: "Productos" },
      { href: "/dashboard/pos", icon: ShoppingBag, label: "POS" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "productos", label: "Productos", icon: Package, format: "number" },
      { id: "bajo_stock", label: "Stock bajo", icon: Wallet, format: "number" },
      { id: "sin_stock", label: "Sin stock", icon: Package, format: "number" },
      { id: "valor", label: "Valor stock", icon: Wallet, format: "currency" },
    ],
    primaryAction: { label: "Escanear con cámara", href: "/dashboard/pos" },
  },
  monotributo: {
    slug: "monotributo",
    marca: "Claver Monotributo",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/ventas/presupuestos", icon: BookOpen, label: "Presupuestos" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "abiertos", label: "Presup. abiertos", icon: BookOpen, format: "number", href: "/dashboard/ventas/presupuestos" },
      { id: "pendiente", label: "Por cobrar", icon: Wallet, format: "currency", href: "/dashboard/cuentas-cobrar" },
      { id: "facturas", label: "Facturas mes", icon: CreditCard, format: "number" },
      { id: "avisos", label: "Avisos WA", icon: MessageSquare, format: "number" },
    ],
    primaryAction: { label: "Nuevo presupuesto", href: "/dashboard/ventas/presupuestos" },
  },
  servicios: {
    slug: "servicios",
    marca: "Claver Servicios Pro",
    icono: Calendar,
    tabs: [
      { href: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
      { href: "/dashboard/ventas/presupuestos", icon: BookOpen, label: "Presupuestos" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "turnos_hoy", label: "Turnos hoy", icon: Calendar, format: "number", href: "/dashboard/agenda" },
      { id: "pipeline", label: "Presupuestos", icon: BookOpen, format: "number" },
      { id: "morosos", label: "Morosos", icon: Users, format: "number" },
      { id: "link", label: "Agenda online", icon: MessageSquare, format: "text" },
    ],
    primaryAction: { label: "Ver agenda", href: "/dashboard/agenda" },
  },
  obra: {
    slug: "obra",
    marca: "Claver Obra",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/nicho/obras", icon: BookOpen, label: "Obra" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Obreros" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "jornales", label: "Jornales semana", icon: BookOpen, format: "number" },
      { id: "liquidacion", label: "A liquidar", icon: Wallet, format: "currency" },
      { id: "hitos", label: "Hitos pendientes", icon: CreditCard, format: "number" },
      { id: "obreros", label: "Obreros", icon: Users, format: "number" },
    ],
    primaryAction: { label: "Registrar jornal", href: "/dashboard/nicho/obras" },
  },
  propiedad: {
    slug: "propiedad",
    marca: "Claver Propiedad",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/nicho/consorcios", icon: BookOpen, label: "Consorcios" },
      { href: "/dashboard/nicho/inmobiliaria", icon: Package, label: "Cartera" },
      { href: "/dashboard/nicho/garantia", icon: CreditCard, label: "Contratos" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "edificios", label: "Edificios", icon: BookOpen, format: "number" },
      { id: "morosos", label: "Morosos UF", icon: Users, format: "number" },
      { id: "liquidacion", label: "Última liq.", icon: Wallet, format: "text" },
      { id: "portales", label: "Portales", icon: MessageSquare, format: "number" },
    ],
    primaryAction: { label: "Liquidar expensas", href: "/dashboard/nicho/consorcios" },
  },
  puntos: {
    slug: "puntos",
    marca: "Claver Puntos",
    icono: Users,
    tabs: [
      { href: "/dashboard/membresias", icon: Users, label: "Socios" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "socios", label: "Socios activos", icon: Users, format: "number" },
      { id: "vencidas", label: "Cuotas vencidas", icon: Wallet, format: "number" },
      { id: "cobradas", label: "Cobradas mes", icon: CreditCard, format: "number" },
      { id: "planes", label: "Planes", icon: BookOpen, format: "number" },
    ],
    primaryAction: { label: "Registrar socio", href: "/dashboard/membresias" },
  },
}

function shellBySlug(slug: string): ProductShellConfig | null {
  return PRODUCT_SHELLS[slug as SubSaasSlug] ?? null
}

/**
 * Determina la Product Shell activa según modoLite y SKUs activos.
 * Si productosSku aún no cargó, usa modoLite como fallback.
 */
export function getActiveProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): ProductShellConfig | null {
  if (modoLite === "completo") return null

  if (productosSku) {
    const activeApps = SUB_SAAS_APPS.filter(
      (app) =>
        productosSku[app.sku] === true ||
        (app.skusAdicionales?.some((sku) => productosSku[sku] === true) ?? false),
    )

    const matchingByModo = activeApps.find((app) => app.modoLite === modoLite)
    if (matchingByModo) {
      const shell = shellBySlug(matchingByModo.slug)
      if (shell) return shell
    }

    for (const app of activeApps) {
      const shell = shellBySlug(app.slug)
      if (shell) return shell
    }
  }

  const fallbackSlug = MODO_LITE_DEFAULT_SLUG[modoLite as ModoLite]
  if (fallbackSlug) return shellBySlug(fallbackSlug)

  return null
}

export function productShellHomePath(shell: ProductShellConfig): string {
  return shell.tabs[0]?.href ?? "/dashboard"
}