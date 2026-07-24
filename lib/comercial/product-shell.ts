import {
  BookOpen,
  Calendar,
  CreditCard,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { type SubSaasSlug, SUB_SAAS_APPS, SUB_SAAS_DESTACADOS } from "./sub-saas-catalog"
import type { ModoLite } from "./pack-calle-catalog"
import { getMicroSaasBySlug } from "./micro-saas-portfolio"

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
    marca: "Claver Confirmá",
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
    marca: "Claver Cuota",
    icono: Users,
    tabs: [
      { href: "/dashboard/membresias", icon: Users, label: "Socios" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cuotas" },
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
  // ── Micro-SaaS freemium (portfolio 11) ───────────────────────────────────
  expensas: {
    slug: "expensas",
    marca: "Claver Expensas",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/nicho/consorcios", icon: BookOpen, label: "Expensas" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Unidades" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "morosos", label: "Morosos UF", icon: Users, format: "number" },
      { id: "periodo", label: "Período", icon: Calendar, format: "text" },
      { id: "pendiente", label: "Por cobrar", icon: Wallet, format: "currency" },
      { id: "unidades", label: "Unidades", icon: Package, format: "number" },
    ],
    primaryAction: { label: "Liquidar mes", href: "/dashboard/nicho/consorcios" },
  },
  renta: {
    slug: "renta",
    marca: "Claver Renta",
    icono: BookOpen,
    tabs: [
      { href: "/dashboard/nicho/inmobiliaria", icon: BookOpen, label: "Cartera" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Inquilinos" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "contratos", label: "Activos", icon: BookOpen, format: "number" },
      { id: "vencen", label: "Vencen 7d", icon: Calendar, format: "number" },
      { id: "morosos", label: "Morosos", icon: Users, format: "number" },
      { id: "mes", label: "Cobrado mes", icon: Wallet, format: "currency" },
    ],
    primaryAction: { label: "Ver vencimientos", href: "/dashboard/nicho/inmobiliaria" },
  },
  sena: {
    slug: "sena",
    marca: "Claver Seña",
    icono: CreditCard,
    tabs: [
      { href: "/dashboard/ventas/presupuestos", icon: BookOpen, label: "Reservas" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Señas" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "pendientes", label: "Seña pendiente", icon: CreditCard, format: "number" },
      { id: "confirmadas", label: "Confirmadas", icon: Users, format: "number" },
      { id: "mes", label: "Señas mes", icon: Wallet, format: "currency" },
      { id: "saldo", label: "Saldos", icon: BookOpen, format: "number" },
    ],
    primaryAction: { label: "Nueva reserva", href: "/dashboard/ventas/presupuestos" },
  },
  caja: {
    slug: "caja",
    marca: "Claver Caja",
    icono: Wallet,
    tabs: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
      { href: "/dashboard/pos", icon: ShoppingBag, label: "Mostrador" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "estado", label: "Estado", icon: Wallet, format: "text", href: "/dashboard/caja" },
      { id: "movimientos", label: "Mov. hoy", icon: CreditCard, format: "number" },
      { id: "diff", label: "Diff arqueo", icon: Package, format: "currency" },
      { id: "alertas", label: "Alertas", icon: MessageSquare, format: "number" },
    ],
    primaryAction: { label: "Abrir caja", href: "/dashboard/caja" },
  },
  abono: {
    slug: "abono",
    marca: "Claver Abono",
    icono: Calendar,
    tabs: [
      { href: "/dashboard/facturacion-recurrente", icon: BookOpen, label: "Abonos" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cobros" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "activos", label: "Abonos activos", icon: BookOpen, format: "number" },
      { id: "emitir", label: "A emitir hoy", icon: Calendar, format: "number" },
      { id: "cobrar", label: "Por cobrar", icon: Wallet, format: "currency" },
      { id: "mes", label: "Emitidos mes", icon: CreditCard, format: "number" },
    ],
    primaryAction: { label: "Ver abonos", href: "/dashboard/facturacion-recurrente" },
  },
  reactiva: {
    slug: "reactiva",
    marca: "Claver Reactiva",
    icono: MessageSquare,
    tabs: [
      { href: "/dashboard/crm", icon: Users, label: "Dormidos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Ajustes" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "dormidos", label: "Dormidos 90d", icon: Users, format: "number" },
      { id: "campanas", label: "Campañas", icon: MessageSquare, format: "number" },
      { id: "reactivados", label: "Reactivados", icon: CreditCard, format: "number" },
      { id: "ticket", label: "Ticket medio", icon: Wallet, format: "currency" },
    ],
    primaryAction: { label: "Ver dormidos", href: "/dashboard/crm" },
  },
  ruta: {
    slug: "ruta",
    marca: "Claver Ruta",
    icono: MapPin,
    tabs: [
      { href: "/vendedor", icon: MapPin, label: "Mapa / Ruta" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/cuentas-cobrar", icon: CreditCard, label: "Cuotas" },
      { href: "/dashboard/ventas", icon: ShoppingBag, label: "Pedidos" },
      { href: "/dashboard/productos", icon: Package, label: "Stock" },
      DEFAULT_MORE_TAB,
    ],
    kpis: [
      { id: "paradas", label: "Paradas hoy", icon: MapPin, format: "number" },
      { id: "cuotas", label: "Cuotas vence", icon: CreditCard, format: "number" },
      { id: "pedidos", label: "Pedidos ruta", icon: ShoppingBag, format: "number" },
      { id: "cobrado", label: "Cobrado calle", icon: Wallet, format: "currency" },
    ],
    primaryAction: { label: "Abrir ruta", href: "/vendedor" },
  },
}

// Asegura shell para cualquier slug micro-saas aún no listado explícitamente
const _microShellFallback = (() => {
  for (const app of SUB_SAAS_APPS) {
    if (PRODUCT_SHELLS[app.slug as SubSaasSlug]) continue
    const micro = getMicroSaasBySlug(app.slug)
    if (!micro) continue
    ;(PRODUCT_SHELLS as Record<string, ProductShellConfig>)[app.slug] = {
      slug: app.slug as SubSaasSlug,
      marca: micro.marca,
      icono: BookOpen,
      tabs: [
        ...micro.shellTabs.map((t) => ({
          href: t.href,
          icon: BookOpen,
          label: t.label,
        })),
        DEFAULT_MORE_TAB,
      ],
      kpis: [
        { id: "kpi1", label: "Actividad", icon: Users, format: "number" as const },
        { id: "kpi2", label: "Pendiente", icon: Wallet, format: "currency" as const },
        { id: "kpi3", label: "Hoy", icon: Calendar, format: "number" as const },
        { id: "kpi4", label: "Estado", icon: MessageSquare, format: "text" as const },
      ],
      primaryAction: micro.primaryAction,
    }
  }
})()

function shellBySlug(slug: string): ProductShellConfig | null {
  return PRODUCT_SHELLS[slug as SubSaasSlug] ?? null
}

/** Orden comercial para desempate (freemium + packs). Menor índice = más prioritario. */
const SHELL_SKU_PRIORITY = [
  "pos.fiado_barrio",
  "intang.cobranzas_wa",
  "micro.confirma_turnos",
  "pos.caja",
  "pool-propiedad",
  "pool-monotributo",
  "micro.abono_recurrente",
  "niche.gimnasio_barrio",
  "niche.consorcios",
] as const

function appIsActive(
  app: (typeof SUB_SAAS_APPS)[number],
  productosSku: Record<string, boolean>,
): boolean {
  if (productosSku[app.sku] === true) return true
  return app.skusAdicionales?.some((sku) => productosSku[sku] === true) ?? false
}

/**
 * Score del producto activo: prioriza SKU primario (exact match), listoPct y orden comercial.
 * modoLite es bonus, no el único criterio — evita que "niche" muestre siempre Confirmá.
 */
function scoreActiveApp(
  app: (typeof SUB_SAAS_APPS)[number],
  productosSku: Record<string, boolean>,
  modoLite: string,
): number {
  let score = 0
  if (productosSku[app.sku] === true) score += 10_000
  if (app.skusAdicionales?.some((sku) => productosSku[sku] === true)) score += 2_000
  if (app.modoLite === modoLite) score += 500
  score += Math.min(app.listoPct, 100)
  if (app.estado === "disponible") score += 50
  else if (app.estado === "beta") score += 10

  const skuIdx = SHELL_SKU_PRIORITY.indexOf(app.sku as (typeof SHELL_SKU_PRIORITY)[number])
  if (skuIdx >= 0) score += (SHELL_SKU_PRIORITY.length - skuIdx) * 20

  const destIdx = (SUB_SAAS_DESTACADOS as readonly string[]).indexOf(app.slug)
  if (destIdx >= 0) score += (SUB_SAAS_DESTACADOS.length - destIdx) * 5

  return score
}

/**
 * Determina la Product Shell activa según SKUs activos (primario) y modoLite (fallback).
 * Si productosSku aún no cargó, usa modoLite.
 */
export function getActiveProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): ProductShellConfig | null {
  if (modoLite === "completo") return null

  if (productosSku) {
    const activeApps = SUB_SAAS_APPS.filter((app) => appIsActive(app, productosSku))
    if (activeApps.length > 0) {
      const ranked = [...activeApps].sort(
        (a, b) =>
          scoreActiveApp(b, productosSku, String(modoLite)) -
          scoreActiveApp(a, productosSku, String(modoLite)),
      )
      for (const app of ranked) {
        const shell = shellBySlug(app.slug)
        if (shell) return shell
      }
    }
  }

  const fallbackSlug = MODO_LITE_DEFAULT_SLUG[modoLite as ModoLite]
  if (fallbackSlug) return shellBySlug(fallbackSlug)

  return null
}

export function productShellHomePath(shell: ProductShellConfig): string {
  return shell.tabs[0]?.href ?? "/dashboard"
}

/** True si la shell activa es Cobrá (modo cobranza o SKU intang.cobranzas_wa). */
export function isCobraProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): boolean {
  const shell = getActiveProductShell(modoLite, productosSku)
  if (shell?.slug === "cobra") return true
  if (modoLite === "cobranza") return true
  if (productosSku?.["intang.cobranzas_wa"] === true && modoLite !== "completo") return true
  return false
}

export function isConfirmaProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): boolean {
  const shell = getActiveProductShell(modoLite, productosSku)
  if (shell?.slug === "turnos") return true
  if (productosSku?.["micro.confirma_turnos"] === true && modoLite !== "completo") return true
  return false
}

export function isCuotaProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): boolean {
  const shell = getActiveProductShell(modoLite, productosSku)
  if (shell?.slug === "puntos") return true
  if (productosSku?.["niche.gimnasio_barrio"] === true && modoLite !== "completo") return true
  return false
}

export function isAbonoProductShell(
  modoLite: ModoLite | string,
  productosSku: Record<string, boolean> | null,
): boolean {
  const shell = getActiveProductShell(modoLite, productosSku)
  if (shell?.slug === "abono") return true
  if (productosSku?.["micro.abono_recurrente"] === true && modoLite !== "completo") return true
  return false
}