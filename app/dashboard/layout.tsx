"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Topbar } from "@/components/topbar"
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
} from "lucide-react"
import { getRubroUx, normalizeRubroValue, type Rubro } from "@/lib/onboarding/onboarding-ia"

interface MenuItem {
  href?: string
  icon: React.ElementType
  label: string
  badge?: string
  children?: MenuItem[]
}

const MODULOS: { label: string; color: string; moduloKey?: string; items: MenuItem[] }[] = [
  {
    label: "Principal",
    color: "text-slate-500",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Compras",
    color: "text-orange-500",
    moduloKey: "compras",
    items: [
      { href: "/dashboard/compras", icon: ShoppingCart, label: "Facturas de Compra" },
      { href: "/dashboard/proveedores", icon: Building2, label: "Proveedores" },
      { href: "/dashboard/remitos", icon: Truck, label: "Remitos Entrada" },
    ],
  },
  {
    label: "Ventas",
    color: "text-green-500",
    moduloKey: "ventas",
    items: [
      { href: "/dashboard/ventas", icon: Receipt, label: "Facturación" },
      { href: "/dashboard/ventas/presupuestos", icon: FileCheck, label: "Presupuestos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/listas-precio", icon: ListOrdered, label: "Listas de Precio" },
      { href: "/dashboard/notas-credito", icon: FileMinus, label: "Notas Crédito/Débito" },
    ],
  },
  {
    label: "Stock",
    color: "text-blue-500",
    moduloKey: "stock",
    items: [
      { href: "/dashboard/productos", icon: Package, label: "Productos" },
      { href: "/dashboard/productos/movimientos", icon: RefreshCw, label: "Movimientos Stock" },
    ],
  },
  {
    label: "Financiero",
    color: "text-violet-500",
    moduloKey: "caja",
    items: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
      { href: "/dashboard/banco", icon: Landmark, label: "Banco" },
      { href: "/dashboard/cuentas-cobrar", icon: FilePlus, label: "Cuentas a Cobrar" },
      { href: "/dashboard/cuentas-pagar", icon: FileMinus, label: "Cuentas a Pagar" },
      { href: "/dashboard/cheques", icon: Banknote, label: "Cheques" },
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
    ],
  },
  {
    label: "Servicios / Rubro",
    color: "text-pink-500",
    moduloKey: "hospitalidad",
    items: [
      { href: "/dashboard/toma-pedidos", icon: ShoppingCart, label: "Toma de Pedidos" },
      { href: "/dashboard/hospitalidad/kds", icon: Monitor, label: "Pantalla Cocina (KDS)" },
      { href: "/dashboard/hospitalidad", icon: UtensilsCrossed, label: "Mesas y Comandas" },
      { href: "/dashboard/hospitalidad/platos", icon: ClipboardList, label: "Platos y Recetas" },
      { href: "/dashboard/agenda", icon: CalendarDays, label: "Agenda de Turnos" },
      { href: "/dashboard/historia-clinica", icon: HeartPulse, label: "Historia Clínica" },
      { href: "/dashboard/membresias", icon: Dumbbell, label: "Membresías" },
      { href: "/dashboard/veterinaria", icon: PawPrint, label: "Veterinaria / Mascotas" },
    ],
  },
  {
    label: "Canales Externos",
    color: "text-teal-500",
    moduloKey: "logistica",
    items: [
      { href: "/portal", icon: Globe, label: "Portal B2B (Clientes)" },
      { href: "/vendedor", icon: ShoppingBag, label: "App Vendedor en Ruta" },
    ],
  },
  {
    label: "Onboarding",
    color: "text-amber-500",
    moduloKey: "onboarding",
    items: [
      { href: "/dashboard/onboarding", icon: Sparkles, label: "Onboarding IA" },
    ],
  },
  {
    label: "Inteligencia Artificial",
    color: "text-purple-500",
    moduloKey: "ia",
    items: [
      { href: "/dashboard/ia", icon: Bot, label: "Asistente IA" },
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
    label: "Configuración",
    color: "text-slate-400",
    items: [
      { href: "/dashboard/configuracion", icon: Settings, label: "Parámetros" },
      { href: "/dashboard/configuracion/cotizaciones", icon: DollarSign, label: "Cotizaciones" },
      { href: "/dashboard/soporte", icon: Bug, label: "Soporte / Tickets" },
      { href: "/dashboard/usuarios", icon: Shield, label: "Usuarios y Permisos" },
      { href: "/dashboard/configuracion/tablas", icon: Database, label: "Tablas del Sistema" },
      { href: "/dashboard/configuracion/auditoria", icon: Clock, label: "Auditoría / Logs" },
    ],
  },
]

function NavItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const pathname = usePathname()
  const isActive = item.href
    ? item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
    : false

  if (!item.href) return null

  return (
    <Link href={item.href} className="block">
      <Button
        variant="ghost"
        size="sm"
        data-active={isActive ? "true" : "false"}
        aria-current={isActive ? "page" : undefined}
        className={cn("sidebar-link", depth > 0 && "pl-6")}
      >
        <item.icon className="sidebar-icon h-4 w-4 shrink-0" />
        <span className="sidebar-label truncate">{item.label}</span>
        {item.badge && (
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
          <NavItem key={`${item.href ?? ""}:${item.label}`} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "sidebar-section-header w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] cursor-pointer select-none rounded-md transition-colors hover:bg-muted/40",
          modulo.color,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [modulosActivos, setModulosActivos] = useState<Record<string, boolean> | null>(null)
  const [rubro, setRubro] = useState<Rubro>("otro")
  const [sidebarSearch, setSidebarSearch] = useState("")
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

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

  useEffect(() => {
    cargarModulos()
    cargarRubro()
    // Re-fetch when config page saves changes
    const handler = () => cargarModulos()
    window.addEventListener("modulos-updated", handler)
    return () => window.removeEventListener("modulos-updated", handler)
  }, [cargarModulos, cargarRubro])

  // Filter sidebar sections based on module config
  const modulosFiltrados = MODULOS.filter((modulo) => {
    // Always show sections without a moduloKey (Principal, Fiscal, Configuración)
    if (!modulo.moduloKey) return true
    // If config hasn't loaded yet, show all
    if (!modulosActivos) return true
    // If not in config, default to visible
    if (modulosActivos[modulo.moduloKey] === undefined) return true
    return modulosActivos[modulo.moduloKey]
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
    <div className="dashboard-canvas flex min-h-screen bg-background/80">
      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-container dashboard-surface border-r flex flex-col",
          "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          sidebarOpen ? "w-60" : "w-14"
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
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground h-7 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <MotionPresence mode="wait">
                <MotionPage pageKey={pathname}>
                  {children}
                </MotionPage>
              </MotionPresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
