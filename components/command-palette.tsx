"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"
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
  Building2,
  BarChart3,
  Truck,
  Landmark,
  CalendarDays,
  Bot,
  Network,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Search,
  Clock,
  Shield,
  UtensilsCrossed,
  Sparkles,
  Bell,
  Globe,
  ClipboardList,
  Cloud,
  Drama,
  Sprout,
  Leaf,
  Building,
  Shirt,
  Wheat,
  Car,
  Stethoscope,
  KeyRound,
  Handshake,
  Bug,
  Wrench,
  Plus,
} from "lucide-react"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { useTheme } from "next-themes"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { canSeeActoresButton, PREVIEW_OPEN_EVENT } from "@/lib/auth/preview-experience-catalog"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTranslations } from "next-intl"
import { getActiveProductShell } from "@/lib/comercial/product-shell"
import { useAuthFetch } from "@/hooks/use-auth-fetch"


/* ═══════════════════════════════════════════════════════════════════════════
   COMMAND PALETTE — Spotlight-style navigation (Cmd+K / Ctrl+K)
   Power-user feature for instant navigation across 40+ ERP modules.
   ═══════════════════════════════════════════════════════════════════════════ */

interface RouteItem {
  href: string
  label: string
  icon: React.ElementType
  keywords?: string[]
  section: string
}

const ROUTES: RouteItem[] = [
  // Principal
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal", keywords: ["inicio", "home", "panel"] },
  // Ventas & Mostrador
  { href: "/dashboard/pos", label: "Punto de Venta (POS)", icon: ShoppingCart, section: "Ventas", keywords: ["pos", "caja", "ticket", "mostrador", "cajero", "venta rapida"] },
  { href: "/dashboard/pos/cierre", label: "Cierre de Turno / Z POS", icon: BarChart3, section: "Ventas", keywords: ["cierre", "pos", "cierre z", "cierre x", "turno"] },
  { href: "/dashboard/ventas", label: "Facturación AFIP", icon: Receipt, section: "Ventas", keywords: ["factura", "venta", "cbte", "emitir", "afip"] },
  { href: "/dashboard/facturas", label: "Historial de Facturas", icon: FileText, section: "Ventas", keywords: ["facturas", "comprobantes", "historial", "emitidas", "cae"] },
  { href: "/dashboard/fiado", label: "Libreta de Fiado", icon: BookOpen, section: "Ventas", keywords: ["fiado", "cuenta corriente", "libreta", "deuda", "cliente"] },
  { href: "/dashboard/ventas/presupuestos", label: "Presupuestos Comerciales", icon: FileText, section: "Ventas", keywords: ["cotización", "propuesta", "presupuesto"] },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, section: "Ventas", keywords: ["cliente", "customer", "directorio"] },
  { href: "/dashboard/listas-precio", label: "Listas de Precio", icon: FileText, section: "Ventas", keywords: ["precio", "tarifa"] },
  { href: "/dashboard/notas-credito", label: "Notas de Crédito / Débito", icon: FileText, section: "Ventas", keywords: ["NC", "ND", "nota", "anular"] },
  // Oficios
  { href: "/dashboard/oficios", label: "Trabajos & Obras", icon: Wrench, section: "Oficios", keywords: ["oficios", "obras", "presupuesto obra", "cuadrilla"] },
  { href: "/dashboard/oficios/nuevo", label: "Nuevo Presupuesto de Obra (3 Niv)", icon: Plus, section: "Oficios", keywords: ["presupuesto obra", "3 niveles", "oficios"] },
  // Compras
  { href: "/dashboard/compras", label: "Facturas de Compra", icon: ShoppingCart, section: "Compras", keywords: ["compra", "proveedor", "FC"] },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Building2, section: "Compras", keywords: ["proveedor", "supplier"] },
  { href: "/dashboard/remitos", label: "Remitos Entrada", icon: Truck, section: "Compras", keywords: ["remito", "entrega"] },
  // Stock
  { href: "/dashboard/productos", label: "Productos", icon: Package, section: "Stock", keywords: ["producto", "artículo", "item", "stock"] },
  { href: "/dashboard/productos/movimientos", label: "Movimientos Stock", icon: Package, section: "Stock", keywords: ["movimiento", "entrada", "salida"] },
  // Financiero
  { href: "/dashboard/caja", label: "Caja", icon: Wallet, section: "Financiero", keywords: ["caja", "cash", "efectivo"] },
  { href: "/dashboard/banco", label: "Banco", icon: Landmark, section: "Financiero", keywords: ["banco", "transferencia", "CBU"] },
  { href: "/dashboard/cuentas-cobrar", label: "Cuentas a Cobrar", icon: FileText, section: "Financiero", keywords: ["cobrar", "deuda", "CC"] },
  { href: "/dashboard/cuentas-pagar", label: "Cuentas a Pagar", icon: FileText, section: "Financiero", keywords: ["pagar", "deuda", "CP"] },
  { href: "/dashboard/cheques", label: "Cheques", icon: FileText, section: "Financiero", keywords: ["cheque"] },
  // Contabilidad
  { href: "/dashboard/contabilidad", label: "Asientos Contables", icon: BookOpen, section: "Contabilidad", keywords: ["asiento", "diario"] },
  { href: "/dashboard/contabilidad/plan-cuentas", label: "Plan de Cuentas", icon: BookOpen, section: "Contabilidad", keywords: ["cuenta", "plan"] },
  { href: "/dashboard/contabilidad/balance", label: "Balances", icon: BarChart3, section: "Contabilidad", keywords: ["balance", "EERR", "patrimonio"] },
  { href: "/dashboard/contabilidad/periodos", label: "Períodos Fiscales", icon: Clock, section: "Contabilidad", keywords: ["periodo", "ejercicio"] },
  // Impuestos
  { href: "/dashboard/impuestos", label: "IVA / Libros Fiscales", icon: FileText, section: "Fiscal", keywords: ["iva", "libro", "fiscal"] },
  { href: "/dashboard/impuestos/iibb", label: "Ingresos Brutos", icon: FileText, section: "Fiscal", keywords: ["iibb", "brutos"] },
  { href: "/dashboard/impuestos/presentacion", label: "Presentación AFIP", icon: Receipt, section: "Fiscal", keywords: ["afip", "presentación", "DDJJ"] },
  // Hospitalidad
  { href: "/dashboard/toma-pedidos", label: "Toma de Pedidos", icon: ShoppingCart, section: "Servicios", keywords: ["pedido", "orden", "mesa"] },
  { href: "/dashboard/hospitalidad/kds", label: "Pantalla Cocina (KDS)", icon: Monitor, section: "Servicios", keywords: ["cocina", "kds", "kitchen"] },
  { href: "/dashboard/hospitalidad", label: "Mesas y Comandas", icon: UtensilsCrossed, section: "Servicios", keywords: ["mesa", "comanda"] },
  { href: "/dashboard/fumigacion", label: "Ruta Fumigación", icon: Bug, section: "Servicios", keywords: ["fumigación", "plagas", "ruta", "hoja de ruta", "visitas", "fumigador"] },
  { href: "/dashboard/agenda", label: "Agenda de Turnos", icon: CalendarDays, section: "Servicios", keywords: ["turno", "agenda", "cita"] },
  { href: "/dashboard/nicho", label: "Claver Nicho LATAM", icon: Sparkles, section: "Claver Nicho", keywords: ["nicho", "mini saas", "consorcio", "club", "feria"] },
  ...NICHE_APPS.map((app) => ({
    href: app.goldenPath,
    label: app.nombre,
    icon:
      app.appId === "consorcios"
        ? Building
        : app.appId === "plancha"
          ? Shirt
          : app.appId === "acopio"
            ? Wheat
            : app.appId === "remis"
              ? Car
              : app.appId === "consultorio"
                ? Stethoscope
                : app.appId === "garantia"
                  ? KeyRound
                  : app.appId === "mutuo"
                    ? Handshake
                    : Sparkles,
    section: "Claver Nicho" as const,
    keywords: [app.appId, app.lema, app.dolorResuelve, "nicho", "claver"],
  })),
  // IA
  { href: "/dashboard/ia", label: "Asistente IA", icon: Bot, section: "Inteligencia", keywords: ["ia", "ai", "chat", "asistente"] },
  { href: "/dashboard/cerebro", label: "Cerebro Visual & Graphify", icon: Network, section: "Inteligencia", keywords: ["cerebro", "graphify", "graphrag", "grafo", "nodos", "ia"] },
  { href: "/dashboard/centro-alertas", label: "Centro de Alertas", icon: Bell, section: "Inteligencia", keywords: ["alerta", "alertas", "telegram", "whatsapp", "notificación"] },
  { href: "/dashboard/conexiones", label: "Centro de Conexiones", icon: Globe, section: "Configuración", keywords: ["integración", "shopify", "mercado pago", "stripe", "conectar"] },
  { href: "/dashboard/onboarding", label: "Onboarding IA", icon: Sparkles, section: "Inteligencia", keywords: ["onboarding", "setup"] },
  { href: "/dashboard/reportes", label: "Clav Sheets", icon: FileText, section: "Inteligencia", keywords: ["reportes", "pivot", "excel", "smartview", "sheets"] },
  { href: "/dashboard/reportes/plantillas", label: "Plantillas Clav Sheets", icon: FileText, section: "Inteligencia", keywords: ["plantillas", "templates", "reportes", "galeria"] },
  // Clavergrow / Agro
  { href: "/dashboard/agro", label: "Clavergrow Dashboard", icon: Sprout, section: "Clavergrow", keywords: ["agro", "clavergrow", "acopio", "granos", "campo"] },
  { href: "/dashboard/agro/balanza", label: "Balanza Camiones", icon: Truck, section: "Clavergrow", keywords: ["balanza", "pesada", "camión", "tn"] },
  { href: "/dashboard/agro/lotes", label: "Lotes y Mapas", icon: Leaf, section: "Clavergrow", keywords: ["lote", "ndvi", "campo", "mapa"] },
  { href: "/dashboard/agro/cannabis", label: "Cultivo regulado", icon: Leaf, section: "Clavergrow", keywords: ["cannabis", "reprocann", "cultivo", "regulado"] },
  { href: "/claver/clavergrow", label: "Landing Clavergrow", icon: Sprout, section: "Marketing", keywords: ["clavergrow", "agro", "landing", "producto"] },
  // Claver Lab + Docs
  { href: "/dashboard/lab", label: "Claver Lab", icon: BookOpen, section: "Claver Docs", keywords: ["lab", "ceo", "pipeline", "leads", "rosario", "misiones", "fundador"] },
  { href: "/dashboard/documentacion", label: "Claver Docs · Room", icon: BookOpen, section: "Claver Docs", keywords: ["docs", "documentación", "wiki", "room", "flujos", "diagramas"] },
  { href: "/dashboard/documentacion/room/como-funciona-todo", label: "Cómo funciona todo", icon: BookOpen, section: "Claver Docs", keywords: ["arquitectura", "flujo", "runtime", "mermaid"] },
  { href: "/dashboard/documentacion/room/requisitos-funcionamiento", label: "Requisitos de marcha", icon: BookOpen, section: "Claver Docs", keywords: ["env", "deploy", "requisitos", "go-live"] },
  { href: "/dashboard/documentacion/room/mapa-grupo", label: "Mapa del Grupo Claver", icon: BookOpen, section: "Claver Docs", keywords: ["grupo", "leo", "cloud", "grow", "partner"] },
  { href: "/dashboard/documentacion/room/flujo-fiado-leo", label: "Flujo Fiado → Leo", icon: BookOpen, section: "Claver Docs", keywords: ["fiado", "leo", "cobranza", "whatsapp"] },
  { href: "/dashboard/capacitacion", label: "Centro de Capacitación", icon: BookOpen, section: "Claver Docs", keywords: ["capacitación", "manual", "usuario"] },
  // Config
  { href: "/dashboard/especialista", label: "Especialista 1 a 1", icon: ClipboardList, section: "Configuración", keywords: ["implementación", "pack", "puesta a punto", "especialista", "setup"] },
  { href: "/dashboard/configuracion", label: "Parámetros", icon: Settings, section: "Configuración", keywords: ["config", "parámetro", "setting"] },
  { href: "/dashboard/usuarios", label: "Usuarios y Permisos", icon: Shield, section: "Configuración", keywords: ["usuario", "permiso", "rol"] },
  // Claver Interno (analistas)
  { href: "/claver-cloud", label: "Claver Cloud", icon: Cloud, section: "Claver Interno", keywords: ["cloud", "torre", "saas", "provisioning", "marketplace", "superadmin"] },
  { href: "/dashboard/claver/operaciones", label: "Flota Claver Cloud", icon: Cloud, section: "Claver Interno", keywords: ["ops", "flota", "vps", "tenant", "claver"] },
  { href: "/dashboard/claver/implementaciones", label: "Torre Implementaciones", icon: ClipboardList, section: "Claver Interno", keywords: ["cca", "onboarding", "implementación", "go-live"] },
  { href: "/dashboard/claver/asignaciones", label: "Asignaciones Analistas", icon: Users, section: "Claver Interno", keywords: ["analista", "asignación", "cliente"] },
  { href: "/dashboard/claver/reportes", label: "Reportes Claver", icon: BarChart3, section: "Claver Interno", keywords: ["reporte", "métricas", "claver"] },
]

export function CommandPalette() {
  const t = useTranslations("CommandPalette")
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { commandPaletteOpen, setCommandPaletteOpen, recentPages } = useUIStore()
  const userRol = useAuthStore((s) => s.user?.rol)
  const { data: analystData } = useAuthFetch<{ isAnalyst?: boolean }>("/api/claver/analista/status")
  const canActores = canSeeActoresButton({
    rol: userRol,
    isAnalyst: Boolean(analystData?.isAnalyst),
  })
  const [docItems, setDocItems] = useState<any[]>([])
  const [modoLite, setModoLite] = useState<string>("completo")

  useEffect(() => {
    if (!commandPaletteOpen) return

    const fetchDocsIndex = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch("/api/docs/index", { headers })
        if (res.ok) {
          const data = await res.json()
          setDocItems(data)
        }
      } catch (err) {
        console.error("Error al cargar el índice de la documentación en la paleta:", err)
      }
    }

    fetchDocsIndex()
  }, [commandPaletteOpen])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const navigate = useCallback(
    (href: string) => {
      setCommandPaletteOpen(false)
      router.push(href)
    },
    [router, setCommandPaletteOpen],
  )

  const isFiado = modoLite === "fiado"
  const isCobra = modoLite === "cobranza"
  const isTurnos = modoLite === "turnos"
  const shell = getActiveProductShell(modoLite, null)

  const filteredRoutes = ROUTES.filter((route) => {
    if (modoLite === "completo") return true
    if (route.href === "/dashboard") return true
    if (shell) {
      return (
        shell.tabs.some((t) => t.href !== "#more" && route.href.startsWith(t.href)) ||
        route.section === "Configuración" ||
        route.href === "/dashboard/mi-plan"
      )
    }
    if (isFiado && (route.section === "Ventas" || route.href.includes("fiado"))) return true
    if (isCobra && route.section === "Financiero") return true
    if (isTurnos && route.section === "Servicios") return true
    if (route.section === "Configuración") return true
    return false
  })

  const sections = filteredRoutes.reduce<Record<string, RouteItem[]>>((acc, route) => {
    if (!acc[route.section]) acc[route.section] = []
    acc[route.section].push(route)
    return acc
  }, {})

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title={t("title")}
      description={t("description")}
    >
      <CommandInput placeholder={t("placeholder")} />
      <CommandList>
        <CommandEmpty>{t("empty")}</CommandEmpty>

        <CommandGroup heading={t("groups.quickActions")}>
          {modoLite === "cobranza" && (
            <CommandItem value="enviar link de cobro" onSelect={() => navigate("/dashboard/cuentas-cobrar")}>
              <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Enviar link de cobro</span>
              <CommandShortcut>EC</CommandShortcut>
            </CommandItem>
          )}
          {modoLite === "fiado" && (
            <CommandItem value="nuevo cliente fiado" onSelect={() => navigate("/dashboard/clientes")}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Nuevo cliente (Fiado)</span>
              <CommandShortcut>NF</CommandShortcut>
            </CommandItem>
          )}
          {modoLite === "turnos" && (
            <CommandItem value="nuevo turno rapido" onSelect={() => navigate("/dashboard/agenda")}>
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Agendar Turno</span>
              <CommandShortcut>AT</CommandShortcut>
            </CommandItem>
          )}
          {canActores && (
            <CommandItem
              value="probar como actor rol rubro experiencia"
              onSelect={() => {
                setCommandPaletteOpen(false)
                window.dispatchEvent(new Event(PREVIEW_OPEN_EVENT))
              }}
            >
              <Drama className="mr-2 h-4 w-4 text-violet-500" />
              <span>Probar como actor / rubro</span>
            </CommandItem>
          )}
          <CommandItem value="nuevo pedido de venta accion rapida" onSelect={() => navigate("/dashboard/ventas/pedidos")}>
            <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t("actions.newSalesOrder")}</span>
            <CommandShortcut>NP</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo presupuesto accion rapida" onSelect={() => navigate("/dashboard/ventas/presupuestos")}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t("actions.newQuote")}</span>
            <CommandShortcut>NPR</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo cliente accion rapida" onSelect={() => navigate("/dashboard/clientes")}>
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t("actions.newCustomer")}</span>
            <CommandShortcut>NC</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo producto accion rapida" onSelect={() => navigate("/dashboard/productos")}>
            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t("actions.newProduct")}</span>
            <CommandShortcut>NPROD</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />

        {/* Recent pages */}
        {recentPages.length > 0 && (
          <CommandGroup heading={t("groups.recent")}>
            {recentPages.slice(0, 5).map((page) => {
              const route = ROUTES.find((r) => r.href === page.href)
              const Icon = route?.icon ?? Clock
              return (
                <CommandItem key={page.href} onSelect={() => navigate(page.href)}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{page.label}</span>
                  <CommandShortcut>
                    {new Date(page.visitedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </CommandShortcut>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* All module sections */}
        {Object.entries(sections).map(([section, routes]) => (
          <CommandGroup key={section} heading={section}>
            {routes.map((route) => (
              <CommandItem
                key={route.href}
                value={`${route.label} ${route.keywords?.join(" ") ?? ""}`}
                onSelect={() => navigate(route.href)}
              >
                <route.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{route.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {/* Documentación Group */}
        {docItems.length > 0 && (
          <>
            <CommandGroup heading={t("groups.docs")}>
              {docItems.map((doc) => (
                <CommandItem
                  key={doc.slug}
                  value={`doc wiki ${doc.title} ${doc.description} ${doc.tags.join(" ")}`}
                  onSelect={() => navigate(doc.href)}
                >
                  <BookOpen className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{doc.title}</span>
                    <span className="text-xs text-muted-foreground font-light line-clamp-1">{doc.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Theme actions */}
        <CommandGroup heading={t("groups.appearance")}>
          <CommandItem onSelect={() => { setTheme("light"); setCommandPaletteOpen(false) }}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t("actions.lightMode")}</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); setCommandPaletteOpen(false) }}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{t("actions.darkMode")}</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); setCommandPaletteOpen(false) }}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>{t("actions.systemTheme")}</span>
          </CommandItem>
        </CommandGroup>

        {/* Session actions */}
        <CommandGroup heading={t("groups.session")}>
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false)
              performLogoutAndRedirect("/login")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("actions.logout")}</span>
            <CommandShortcut>⇧⌘Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
