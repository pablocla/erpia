"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Topbar } from "@/components/topbar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MotionPage, MotionPresence } from "@/components/ui/motion"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  FileText,
  BookOpen,
  Settings,
  Users,
  Scissors,
  ChevronDown,
  ChevronRight,
  Building2,
  BarChart3,
  Truck,
  ClipboardList,
  CreditCard,
  Landmark,
  FileMinus,
  FilePlus,
  Tags,
  RefreshCw,
  Shield,
  Database,
  Clock,
  LogOut,
  Menu,
  X,
  Bug,
  UtensilsCrossed,
  Monitor,
  CalendarDays,
  HeartPulse,
  Sparkles,
  Dumbbell,
  Route,
  Factory,
  Layers,
  ScanLine,
  ListChecks,
  Cpu,
  Activity,
  TriangleAlert,
  Store,
  Hash,
  Warehouse,
  Wrench,
  ListOrdered,
  FolderTree,
  TrendingDown,
  DollarSign,
  FileCheck,
  PawPrint,
  Stethoscope,
  ShoppingBag,
  Globe,
  Tablet,
  CheckSquare,
  MapPin,
  Banknote,
  Search,
  Bot,
  GraduationCap,
  Target,
  Calculator,
  Wallet2,
  ClipboardCheck,
  Bell,
  Repeat,
  UserCircle,
  FileSpreadsheet,
} from "lucide-react"
import { getRubroUx, normalizeRubroValue, type Rubro } from "@/lib/onboarding/onboarding-ia"
import { ROLES_SISTEMA } from "@/lib/auth/roles"
import { useUIStore } from "@/lib/stores/ui-store"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { RecentlyViewed } from "@/components/recently-viewed"
import { useIsMobile } from "@/hooks/use-mobile"

interface MenuItem {
  href?: string
  icon: React.ElementType
  label: string
  badge?: string
  children?: MenuItem[]
  featureKey?: string
  permisoModulo?: string
  allowedRoles?: string[]
  excludedRoles?: string[]
  allowedUsers?: string[]
  allowedRubros?: Rubro[]
}

const MODULOS: { label: string; color: string; moduloKey?: string; items: MenuItem[] }[] = [
  {
    label: "Principal",
    color: "text-slate-500",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/mis-tareas", icon: CheckSquare, label: "Mis Tareas" },
    ],
  },
  {
    label: "Compras",
    color: "text-orange-500",
    moduloKey: "compras",
    items: [
      { href: "/dashboard/compras", icon: ShoppingCart, label: "Facturas de Compra", permisoModulo: "compras" },
      { href: "/dashboard/proveedores", icon: Building2, label: "Proveedores", permisoModulo: "proveedores" },
      { href: "/dashboard/remitos", icon: Truck, label: "Remitos Entrada", permisoModulo: "remitos" },
    ],
  },
  {
    label: "Ventas",
    color: "text-green-500",
    moduloKey: "ventas",
    items: [
      { href: "/dashboard/pos", icon: Store, label: "Punto de Venta (POS)", permisoModulo: "pos", featureKey: "pos" },
      { href: "/dashboard/pos/cierre", icon: BarChart3, label: "Cierre X / Z", permisoModulo: "pos" },
      { href: "/dashboard/ventas", icon: Receipt, label: "Facturación", permisoModulo: "ventas" },
      { href: "/dashboard/ventas/pedidos", icon: ClipboardList, label: "Pedidos de Venta", permisoModulo: "pedidos_venta" },
      { href: "/dashboard/ventas/presupuestos", icon: FileCheck, label: "Presupuestos", permisoModulo: "presupuestos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes", permisoModulo: "clientes" },
      { href: "/dashboard/listas-precio", icon: ListOrdered, label: "Listas de Precio", permisoModulo: "productos" },
      { href: "/dashboard/notas-credito", icon: FileMinus, label: "Notas Crédito/Débito", permisoModulo: "notas_credito" },
      { href: "/dashboard/facturacion-recurrente", icon: Repeat, label: "Facturación Recurrente", permisoModulo: "ventas" },
    ],
  },
  {
    label: "Stock",
    color: "text-blue-500",
    moduloKey: "stock",
    items: [
      { href: "/dashboard/productos", icon: Package, label: "Productos", permisoModulo: "productos" },
      { href: "/dashboard/productos/inventario", icon: Warehouse, label: "Inventario", permisoModulo: "stock" },
      { href: "/dashboard/productos/transferencias", icon: Truck, label: "Transferencias Stock", permisoModulo: "stock" },
      { href: "/dashboard/productos/ajustes", icon: Wrench, label: "Ajustes de Stock", permisoModulo: "stock" },
      { href: "/dashboard/productos/movimientos", icon: RefreshCw, label: "Movimientos Stock", permisoModulo: "stock" },
    ],
  },
  {
    label: "Financiero",
    color: "text-violet-500",
    moduloKey: "caja",
    items: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja", permisoModulo: "caja" },
      { href: "/dashboard/banco", icon: Landmark, label: "Banco", permisoModulo: "cuentas_cobrar" },
      { href: "/dashboard/cuentas-cobrar", icon: FilePlus, label: "Cuentas a Cobrar", permisoModulo: "cuentas_cobrar" },
      { href: "/dashboard/cuentas-pagar", icon: FileMinus, label: "Cuentas a Pagar", permisoModulo: "cuentas_pagar" },
      { href: "/dashboard/cheques", icon: Banknote, label: "Cheques", permisoModulo: "cheques" },
      { href: "/dashboard/cashflow", icon: Wallet2, label: "Flujo de Fondos", permisoModulo: "caja" },
      { href: "/dashboard/presupuesto", icon: Calculator, label: "Control Presupuestario", permisoModulo: "caja" },
      { href: "/dashboard/mercadopago", icon: CreditCard, label: "MercadoPago", permisoModulo: "caja" },
    ],
  },
  {
    label: "Contabilidad",
    color: "text-cyan-500",
    moduloKey: "contabilidad",
    items: [
      { href: "/dashboard/contabilidad", icon: BookOpen, label: "Asientos Contables" },
      { href: "/dashboard/contabilidad/plan-cuentas", icon: ClipboardList, label: "Plan de Cuentas" },
      { href: "/dashboard/contabilidad/balance", icon: BarChart3, label: "Balances" },
      { href: "/dashboard/contabilidad/periodos", icon: Clock, label: "Períodos Fiscales" },
      { href: "/dashboard/contabilidad/activos-fijos", icon: TrendingDown, label: "Activos Fijos" },
      { href: "/dashboard/contabilidad/centros-costo", icon: FolderTree, label: "Centros de Costo" },
      { href: "/dashboard/contabilidad/inflacion", icon: TrendingDown, label: "Ajuste por Inflación" },
    ],
  },
  {
    label: "Fiscal / Impuestos",
    color: "text-red-500",
    items: [
      { href: "/dashboard/impuestos",              icon: FileText,      label: "IVA / Libros Fiscales" },
      { href: "/dashboard/impuestos/iibb",          icon: FileText,      label: "Ingresos Brutos" },
      { href: "/dashboard/impuestos/padron",         icon: Database,      label: "Padrón IIBB" },
      { href: "/dashboard/impuestos/tes",           icon: Tags,          label: "TES (Tipos de Impuesto)" },
      { href: "/dashboard/impuestos/presentacion",  icon: Receipt,       label: "Presentación AFIP" },
      { href: "/dashboard/puntos-venta",            icon: Store,         label: "Puntos de Venta" },
      { href: "/dashboard/series",                  icon: Hash,          label: "Series de Comprobantes" },
      { href: "/dashboard/impuestos/citi",        icon: FileSpreadsheet, label: "CITI Ventas/Compras" },
    ],
  },
  {
    label: "Servicios / Rubro",
    color: "text-pink-500",
    moduloKey: "hospitalidad",
    items: [
      { href: "/dashboard/toma-pedidos", icon: ShoppingCart, label: "Toma de Pedidos", permisoModulo: "hospitalidad" },
      { href: "/dashboard/hospitalidad/kds", icon: Monitor, label: "Pantalla Cocina (KDS)", permisoModulo: "kds", featureKey: "kds" },
      { href: "/dashboard/hospitalidad", icon: UtensilsCrossed, label: "Mesas y Comandas", permisoModulo: "hospitalidad" },
      { href: "/dashboard/hospitalidad/platos", icon: ClipboardList, label: "Platos y Recetas", featureKey: "recetas_bom", allowedRubros: ["bar_restaurant"] },
      { href: "/dashboard/agenda", icon: CalendarDays, label: "Agenda de Turnos", permisoModulo: "agenda", featureKey: "turnos_agenda", allowedRubros: ["veterinaria", "clinica", "salon_belleza", "gimnasio"] },
      { href: "/dashboard/peluqueria", icon: Scissors, label: "Peluquería móvil", permisoModulo: "agenda", featureKey: "turnos_agenda", allowedRubros: ["salon_belleza"] },
      { href: "/dashboard/historia-clinica", icon: HeartPulse, label: "Historia Clínica", permisoModulo: "historia_clinica", featureKey: "historia_clinica", allowedRubros: ["veterinaria", "clinica"] },
      { href: "/dashboard/membresias", icon: Dumbbell, label: "Membresías", permisoModulo: "membresias", featureKey: "membresias", allowedRubros: ["gimnasio"] },
      { href: "/dashboard/veterinaria", icon: PawPrint, label: "Veterinaria / Mascotas", permisoModulo: "veterinaria", featureKey: "veterinaria", allowedRubros: ["veterinaria"] },
    ],
  },
  {
    label: "Canales Externos",
    color: "text-teal-500",
    moduloKey: "logistica",
    items: [
      { href: "/portal", icon: Globe, label: "Portal B2B (Clientes)", featureKey: "portal_b2b" },
      { href: "/vendedor", icon: ShoppingBag, label: "App Vendedor en Ruta", featureKey: "hojas_ruta" },
    ],
  },
  {
    label: "Onboarding",
    color: "text-amber-500",
    moduloKey: "onboarding",
    items: [
      { href: "/dashboard/onboarding", icon: Sparkles, label: "Onboarding IA", featureKey: "onboarding" },
    ],
  },
  {
    label: "Inteligencia Artificial",
    color: "text-purple-500",
    moduloKey: "ia",
    items: [
      { href: "/dashboard/ia", icon: Bot, label: "Asistente IA", featureKey: "ia" },
    ],
  },
  {
    label: "Logística",
    color: "text-emerald-500",
    moduloKey: "logistica",
    items: [
      { href: "/dashboard/logistica", icon: Truck, label: "Envíos" },
      { href: "/dashboard/logistica", icon: Route, label: "Transportistas" },
      { href: "/dashboard/distribucion", icon: Route, label: "Distribución" },
      { href: "/dashboard/distribucion/pod", icon: CheckSquare, label: "POD / Comprobante entrega" },
    ],
  },
  {
    label: "Industria",
    color: "text-orange-600",
    moduloKey: "industria",
    items: [
      { href: "/dashboard/industria", icon: Factory, label: "Órdenes de Producción" },
      { href: "/dashboard/industria", icon: Layers, label: "Lista de Materiales (BOM)" },
      { href: "/dashboard/mrp", icon: Factory, label: "MRP (Planificación)" },
      { href: "/dashboard/calidad", icon: ClipboardCheck, label: "Control de Calidad" },
      { href: "/dashboard/mantenimiento", icon: Wrench, label: "Mantenimiento Preventivo" },
    ],
  },
  {
    label: "Picking",
    color: "text-violet-500",
    moduloKey: "picking",
    items: [
      { href: "/dashboard/picking", icon: ScanLine, label: "Listas de Picking" },
      { href: "/dashboard/picking", icon: ListChecks, label: "Control de Armado" },
      { href: "/dashboard/picking/tablet", icon: Tablet, label: "Modo Tablet (depósito)" },
    ],
  },
  {
    label: "IoT",
    color: "text-sky-500",
    moduloKey: "iot",
    items: [
      { href: "/dashboard/iot", icon: Cpu, label: "Dispositivos IoT" },
      { href: "/dashboard/iot", icon: Activity, label: "Telemetría & Lecturas" },
      { href: "/dashboard/iot", icon: TriangleAlert, label: "Alertas IoT" },
    ],
  },
  {
    label: "Gestión Comercial",
    color: "text-rose-500",
    items: [
      { href: "/dashboard/crm", icon: Target, label: "CRM / Pipeline" },
      { href: "/dashboard/aprobaciones", icon: Shield, label: "Aprobaciones" },
      { href: "/dashboard/kpis", icon: Activity, label: "Tablero KPIs" },
      { href: "/dashboard/alertas", icon: Bell, label: "Alertas Configurables" },
    ],
  },
  {
    label: "RRHH",
    color: "text-lime-500",
    items: [
      { href: "/dashboard/empleados", icon: UserCircle, label: "Empleados / Legajos", permisoModulo: "rrhh" },
      { href: "/dashboard/rrhh/sueldos", icon: Calculator, label: "Liquidación de Sueldos", permisoModulo: "rrhh" },
    ],
  },
  {
    label: "Capacitación",
    color: "text-indigo-500",
    items: [
      { href: "/dashboard/capacitacion", icon: GraduationCap, label: "Centro de Capacitación" },
      { href: "/dashboard/capacitacion/parametrizacion", icon: Settings, label: "Parametrización" },
      { href: "/dashboard/capacitacion/manual-usuario", icon: BookOpen, label: "Manual de Usuario" },
      { href: "/dashboard/capacitacion/diagnostico", icon: Target, label: "Diagnóstico Gaps" },
    ],
  },
  {
    label: "Configuración",
    color: "text-slate-400",
    items: [
      { href: "/dashboard/configuracion", icon: Settings, label: "Parámetros", permisoModulo: "configuracion" },
      { href: "/dashboard/cotizaciones", icon: DollarSign, label: "Cotizaciones", permisoModulo: "configuracion" },
      { href: "/dashboard/soporte", icon: Bug, label: "Soporte / Tickets", permisoModulo: "configuracion" },
      { href: "/dashboard/usuarios", icon: Shield, label: "Usuarios y Permisos", permisoModulo: "usuarios" },
      { href: "/dashboard/configuracion/tablas", icon: Database, label: "Tablas del Sistema", permisoModulo: "configuracion" },
      { href: "/dashboard/configuracion/auditoria", icon: Clock, label: "Auditoría / Logs", permisoModulo: "auditoria" },
    ],
  },
]

function NavItem({ item, depth = 0, sidebarOpen = true }: { item: MenuItem; depth?: number; sidebarOpen?: boolean }) {
  const pathname = usePathname()
  const isActive = item.href
    ? item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
    : false

  if (!item.href) return null

  return (
    <Link href={item.href} className="block" title={!sidebarOpen ? item.label : undefined}>
      <Button
        variant="ghost"
        size="sm"
        data-active={isActive ? "true" : "false"}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "sidebar-link w-full",
          sidebarOpen ? "flex items-center gap-3 justify-start" : "flex items-center justify-center",
          depth > 0 && sidebarOpen && "pl-6",
        )}
      >
        <item.icon className="sidebar-icon h-4 w-4 flex-shrink-0" />
        {sidebarOpen && <span className="sidebar-label truncate">{item.label}</span>}
        {sidebarOpen && item.badge && (
          <Badge className="ml-auto h-4 text-[10px] px-1" variant="secondary">
            {item.badge}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

function CollapseSection({
  modulo,
  sidebarOpen,
  defaultExpanded = false,
}: {
  modulo: { label: string; color: string; moduloKey?: string; items: MenuItem[] }
  sidebarOpen: boolean
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const pathname = usePathname()
  const hasActiveChild = modulo.items.some(
    (item) =>
      item.href &&
      (item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href)),
  )

  // Auto-expand if any child is active
  useEffect(() => {
    if (hasActiveChild && !expanded) setExpanded(true)
  }, [hasActiveChild])

  if (!sidebarOpen) {
    return (
      <div className="space-y-0.5">
        {modulo.items.map((item) => (
          <NavItem key={`${item.href ?? ""}:${item.label}`} item={item} sidebarOpen={sidebarOpen} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "sidebar-section-header w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] cursor-pointer select-none rounded-md transition-colors hover:bg-muted/40 text-muted-foreground",
        )}
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-200",
            !expanded && "-rotate-90",
          )}
        />
        <span className="flex-1 text-left">{modulo.label}</span>
        {hasActiveChild && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </button>
      <div
        className={cn(
          "sidebar-collapse-content overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
          expanded ? "max-h-[500px] opacity-100 mt-0.5" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-0.5">
          {modulo.items.map((item) => (
            <NavItem key={`${item.href ?? ""}:${item.label}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ordenarModulosPorRubro(modulos: { label: string; color: string; moduloKey?: string; items: MenuItem[] }[], rubro: Rubro) {
  const prioridad = getRubroUx(rubro).sidebarPrioridad
  return modulos
    .map((modulo, index) => ({ modulo, index }))
    .sort((a, b) => {
      const scoreA = getModuloScore(a.modulo, a.index, prioridad)
      const scoreB = getModuloScore(b.modulo, b.index, prioridad)
      return scoreA - scoreB
    })
    .map(({ modulo }) => modulo)
}

function getModuloScore(
  modulo: { label: string; moduloKey?: string },
  index: number,
  prioridad: string[],
) {
  if (modulo.label === "Principal") return -1000
  if (modulo.label === "Configuración") return 10000 + index
  if (!modulo.moduloKey) return 5000 + index
  const priorityIndex = prioridad.indexOf(modulo.moduloKey)
  if (priorityIndex === -1) return 3000 + index
  return 100 + priorityIndex
}

function getRoleDefinition(role?: string) {
  if (!role) return null
  return ROLES_SISTEMA.find((rol) => rol.codigo === role)
}

function hasRoleAccessToModulo(role: string | undefined, modulo: string): boolean {
  if (!role) return false
  if (["administrador", "admin", "dueno"].includes(role)) return true
  const def = getRoleDefinition(role)
  return def?.modulosAcceso.some((m) => m.modulo === modulo) ?? false
}

function canRenderMenuItem(
  item: MenuItem,
  role: string | undefined,
  modulosActivos: Record<string, boolean> | null,
  features: Record<string, boolean> | null,
  userId: string | null,
  rubro: Rubro,
) {
  if (["administrador", "admin", "dueno"].includes(role || "")) return true

  if (!role) {
    if (item.featureKey) {
      if (features && features[item.featureKey] === false) return false
      if (modulosActivos && modulosActivos[item.featureKey] === false) return false
    }
    return true
  }

  if (item.allowedUsers?.length && userId) {
    if (!item.allowedUsers.includes(userId)) return false
  }

  if (item.allowedRoles) {
    if (!item.allowedRoles.includes(role)) return false
  }

  if (item.allowedRubros && !item.allowedRubros.includes(rubro)) {
    return false
  }

  if (item.excludedRoles && item.excludedRoles.includes(role)) return false

  if (item.permisoModulo) {
    if (!hasRoleAccessToModulo(role, item.permisoModulo)) return false
  }

  if (item.featureKey) {
    if (features && features[item.featureKey] === false) return false
    if (modulosActivos && modulosActivos[item.featureKey] === false) return false
  }

  return true
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [modulosActivos, setModulosActivos] = useState<Record<string, boolean> | null>(null)
  const [featuresActivas, setFeaturesActivas] = useState<Record<string, boolean> | null>(null)
  const [rubro, setRubro] = useState<Rubro>("otro")
  const [sidebarSearch, setSidebarSearch] = useState("")
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const role = user?.rol
  const userId = user?.id ?? null
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false)
    }
  }, [isMobile])

  // Redirect to login if no token on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token && mounted) {
      router.replace("/login")
    }
  }, [mounted, router])

  // Track recently viewed pages
  const addRecentPage = useUIStore((s) => s.addRecentPage)
  useEffect(() => {
    if (pathname && pathname !== "/dashboard") {
      const segments = pathname.split("/").filter(Boolean)
      const last = segments[segments.length - 1]
      const label = last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ") : ""
      if (label) addRecentPage(pathname, label)
    }
  }, [pathname, addRecentPage])

  const handleLogout = useCallback(() => {
    logout()
    router.replace("/login")
  }, [logout, router])

  const authHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarModulos = useCallback(async () => {
    try {
      const res = await fetch("/api/config/modulos", {
        headers: authHeaders(),
      })
      if (res.ok) {
        setModulosActivos(await res.json())
      }
    } catch { /* use all modules */ }
  }, [authHeaders])

  const cargarRubro = useCallback(async () => {
    try {
      const res = await fetch("/api/config/empresa", {
        headers: authHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      setRubro(normalizeRubroValue(data?.rubro))
    } catch {
      setRubro("otro")
    }
  }, [authHeaders])

  const cargarFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/config/features", {
        headers: authHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const mapa: Record<string, boolean> = {}
      if (Array.isArray(data)) {
        for (const feature of data) {
          if (typeof feature.featureKey === "string") {
            mapa[feature.featureKey] = feature.activado
          }
        }
      }
      setFeaturesActivas(mapa)
    } catch {
      setFeaturesActivas(null)
    }
  }, [authHeaders])

  useEffect(() => {
    cargarModulos()
    cargarRubro()
    cargarFeatures()
    // Re-fetch when config page saves changes
    const handler = () => {
      cargarModulos()
      cargarFeatures()
    }
    window.addEventListener("modulos-updated", handler)
    return () => window.removeEventListener("modulos-updated", handler)
  }, [cargarModulos, cargarRubro, cargarFeatures])

  const isAdmin = ["administrador", "admin", "dueno"].includes(role || "")

  const modulosFiltrados = MODULOS.map((modulo) => ({
    ...modulo,
    items: modulo.items.filter((item) =>
      canRenderMenuItem(item, role, modulosActivos, featuresActivas, userId, rubro),
    ),
  })).filter((modulo) => {
    // Always show sections without a moduloKey if they still have visible items
    if (!modulo.moduloKey) return modulo.items.length > 0
    if (isAdmin) return true
    if (!modulosActivos) return modulo.items.length > 0
    if (modulosActivos[modulo.moduloKey] === false) return false
    return modulo.items.length > 0
  })

  const modulosOrdenados = ordenarModulosPorRubro(modulosFiltrados, rubro)

  // Search filter for sidebar
  const modulosBuscados = useMemo(() => {
    if (!sidebarSearch.trim()) return modulosOrdenados
    const q = sidebarSearch.toLowerCase()
    return modulosOrdenados
      .map((modulo) => ({
        ...modulo,
        items: modulo.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((modulo) => modulo.items.length > 0)
  }, [modulosOrdenados, sidebarSearch])

  return (
    <div className="dashboard-canvas flex min-h-screen relative overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-container border-r flex flex-col z-20 relative bg-sidebar/95 backdrop-blur-xl shadow-[1px_0_12px_rgba(0,0,0,0.02)]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hidden md:flex",
          sidebarOpen ? "w-64" : "w-[4.25rem]"
        )}
      >
        {/* Header */}
        <div className="p-3 border-b flex items-center gap-2">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-primary truncate leading-tight">ERP Argentina</h2>
                  <p className="text-[9px] text-muted-foreground leading-tight flex items-center gap-1">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operación en tiempo real
                  </p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Search (only when sidebar is open) */}
        {sidebarOpen && (
          <div className="px-2 pt-2 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Buscar módulo..."
                className="h-7 pl-7 text-xs bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {modulosBuscados.map((modulo) => (
              <CollapseSection
                key={modulo.label}
                modulo={modulo}
                sidebarOpen={sidebarOpen}
                defaultExpanded={modulo.label === "Principal" || !!sidebarSearch}
              />
            ))}
            {sidebarSearch && modulosBuscados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                Sin resultados para &ldquo;{sidebarSearch}&rdquo;
              </p>
            )}
          </nav>
        </ScrollArea>

        <RecentlyViewed collapsed={!sidebarOpen} />

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Administrador</p>
                <p className="text-[10px] text-muted-foreground">admin@empresa.com</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground h-7 text-xs" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full rounded-tl-xl border-t border-l border-border/30 bg-background/40 backdrop-blur-sm sm:mt-1.5 sm:ml-1.5 shadow-[-4px_-4px_24px_rgba(0,0,0,0.02)]">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-surface/30">
          <div className="p-4 sm:p-6 pb-20 md:pb-6">
            <Breadcrumbs className="mb-4" />
            <div className="mx-auto w-full max-w-[1400px]">
              <MotionPresence mode="wait">
                <MotionPage pageKey={pathname}>
                  {children}
                </MotionPage>
              </MotionPresence>
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative z-50 h-full w-full max-w-[80vw] bg-sidebar/95 border-r border-border/60 shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-primary truncate leading-tight">ERP Argentina</h2>
                      <p className="text-[9px] text-muted-foreground leading-tight flex items-center gap-1">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Operación en tiempo real
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="px-2 pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Buscar módulo..."
                    className="h-7 pl-7 text-xs bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <nav className="p-2 space-y-1">
                  {modulosBuscados.map((modulo) => (
                    <CollapseSection
                      key={modulo.label}
                      modulo={modulo}
                      sidebarOpen={true}
                      defaultExpanded={modulo.label === "Principal" || !!sidebarSearch}
                    />
                  ))}
                  {sidebarSearch && modulosBuscados.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 px-2">
                      Sin resultados para &ldquo;{sidebarSearch}&rdquo;
                    </p>
                  )}
                </nav>
              </ScrollArea>

              <RecentlyViewed collapsed={false} />

              <div className="p-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Administrador</p>
                    <p className="text-[10px] text-muted-foreground">admin@empresa.com</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground h-7 text-xs" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
