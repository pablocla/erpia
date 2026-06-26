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
} from "lucide-react"
import { useTheme } from "next-themes"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { useUIStore } from "@/lib/stores/ui-store"


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
  // Ventas
  { href: "/dashboard/ventas", label: "Facturación", icon: Receipt, section: "Ventas", keywords: ["factura", "venta", "cbte"] },
  { href: "/dashboard/ventas/presupuestos", label: "Presupuestos", icon: FileText, section: "Ventas", keywords: ["cotización", "propuesta"] },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, section: "Ventas", keywords: ["cliente", "customer"] },
  { href: "/dashboard/listas-precio", label: "Listas de Precio", icon: FileText, section: "Ventas", keywords: ["precio", "tarifa"] },
  { href: "/dashboard/notas-credito", label: "Notas Crédito/Débito", icon: FileText, section: "Ventas", keywords: ["NC", "ND", "nota"] },
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
  { href: "/dashboard/agenda", label: "Agenda de Turnos", icon: CalendarDays, section: "Servicios", keywords: ["turno", "agenda", "cita"] },
  // IA
  { href: "/dashboard/ia", label: "Asistente IA", icon: Bot, section: "Inteligencia", keywords: ["ia", "ai", "chat", "asistente"] },
  { href: "/dashboard/centro-alertas", label: "Centro de Alertas", icon: Bell, section: "Inteligencia", keywords: ["alerta", "alertas", "telegram", "whatsapp", "notificación"] },
  { href: "/dashboard/conexiones", label: "Centro de Conexiones", icon: Globe, section: "Configuración", keywords: ["integración", "shopify", "mercado pago", "stripe", "conectar"] },
  { href: "/dashboard/onboarding", label: "Onboarding IA", icon: Sparkles, section: "Inteligencia", keywords: ["onboarding", "setup"] },
  { href: "/dashboard/reportes", label: "Clav Sheets", icon: FileText, section: "Inteligencia", keywords: ["reportes", "pivot", "excel", "smartview", "sheets"] },
  { href: "/dashboard/reportes/plantillas", label: "Plantillas Clav Sheets", icon: FileText, section: "Inteligencia", keywords: ["plantillas", "templates", "reportes", "galeria"] },
  // Config
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
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { commandPaletteOpen, setCommandPaletteOpen, recentPages } = useUIStore()
  const [docItems, setDocItems] = useState<any[]>([])

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

  const sections = ROUTES.reduce<Record<string, RouteItem[]>>((acc, route) => {
    if (!acc[route.section]) acc[route.section] = []
    acc[route.section].push(route)
    return acc
  }, {})

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Paleta de comandos"
      description="Buscar módulos, acciones y configuración del ERP"
    >
      <CommandInput placeholder="Buscar módulo, acción o configuración..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        <CommandGroup heading="Acciones Rápidas">
          <CommandItem value="nuevo pedido de venta accion rapida" onSelect={() => navigate("/dashboard/ventas/pedidos")}>
            <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nuevo Pedido de Venta</span>
            <CommandShortcut>NP</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo presupuesto accion rapida" onSelect={() => navigate("/dashboard/ventas/presupuestos")}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nuevo Presupuesto</span>
            <CommandShortcut>NPR</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo cliente accion rapida" onSelect={() => navigate("/dashboard/clientes")}>
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nuevo Cliente</span>
            <CommandShortcut>NC</CommandShortcut>
          </CommandItem>
          <CommandItem value="nuevo producto accion rapida" onSelect={() => navigate("/dashboard/productos")}>
            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Nuevo Producto</span>
            <CommandShortcut>NPROD</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />

        {/* Recent pages */}
        {recentPages.length > 0 && (
          <CommandGroup heading="Recientes">
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
            <CommandGroup heading="Documentación (Wiki)">
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
        <CommandGroup heading="Apariencia">
          <CommandItem onSelect={() => { setTheme("light"); setCommandPaletteOpen(false) }}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Modo Claro</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); setCommandPaletteOpen(false) }}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Modo Oscuro</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); setCommandPaletteOpen(false) }}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>Tema del Sistema</span>
          </CommandItem>
        </CommandGroup>

        {/* Session actions */}
        <CommandGroup heading="Sesión">
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false)
              performLogoutAndRedirect("/login")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
            <CommandShortcut>⇧⌘Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
