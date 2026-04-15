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
} from "lucide-react"
import { useTheme } from "next-themes"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"

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
  { href: "/dashboard/onboarding", label: "Onboarding IA", icon: Sparkles, section: "Inteligencia", keywords: ["onboarding", "setup"] },
  // Config
  { href: "/dashboard/configuracion", label: "Parámetros", icon: Settings, section: "Configuración", keywords: ["config", "parámetro", "setting"] },
  { href: "/dashboard/usuarios", label: "Usuarios y Permisos", icon: Shield, section: "Configuración", keywords: ["usuario", "permiso", "rol"] },
]

export function CommandPalette() {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { commandPaletteOpen, setCommandPaletteOpen, recentPages } = useUIStore()
  const logout = useAuthStore((s) => s.logout)

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
              logout()
              setCommandPaletteOpen(false)
              router.push("/login")
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
