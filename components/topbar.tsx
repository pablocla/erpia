"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { ContextualHelp } from "@/components/contextual-help"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Bell,
  Search,
  TicketCheck,
  ChevronRight,
  Wallet,
  LogOut,
  Settings,
  User,
  Sun,
  Moon,
} from "lucide-react"

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  ventas: "Ventas",
  compras: "Compras",
  productos: "Productos",
  clientes: "Clientes",
  proveedores: "Proveedores",
  caja: "Caja",
  banco: "Banco",
  contabilidad: "Contabilidad",
  configuracion: "Configuración",
  usuarios: "Usuarios",
  impuestos: "Impuestos",
  hospitalidad: "Hospitalidad",
  "listas-precio": "Listas de Precio",
  "notas-credito": "Notas Crédito/Débito",
  "cuentas-cobrar": "Cuentas a Cobrar",
  "cuentas-pagar": "Cuentas a Pagar",
  "plan-cuentas": "Plan de Cuentas",
  balance: "Balances",
  tes: "TES",
  remitos: "Remitos",
  agenda: "Agenda",
  "historia-clinica": "Historia Clínica",
  membresias: "Membresías",
  logistica: "Logística",
  industria: "Industria",
  picking: "Picking",
  iot: "IoT",
  kds: "KDS",
  onboarding: "Onboarding IA",
  soporte: "Soporte",
  movimientos: "Movimientos",
  tablas: "Tablas del Sistema",
  auditoria: "Auditoría",
  "puntos-venta": "Puntos de Venta",
  series: "Series",
  presentacion: "Presentación AFIP",
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/")
        const label = BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = i === segments.length - 1

        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 animate-fade-in" />}
            {isLast ? (
              <span className="font-medium text-foreground animate-slide-down-fade">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

interface TopbarProps {
  onSearchClick?: () => void
}

export function Topbar({ onSearchClick }: TopbarProps) {
  const [bellShake, setBellShake] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Trigger bell shake on mount and periodically
  useEffect(() => {
    const timer = setTimeout(() => setBellShake(true), 1200)
    const interval = setInterval(() => {
      setBellShake(true)
      setTimeout(() => setBellShake(false), 700)
    }, 30000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="h-12 border-b bg-background/60 backdrop-blur-md flex items-center justify-between px-4 shrink-0 animate-fade-in">
      {/* Left: Breadcrumbs */}
      <Breadcrumbs />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-foreground text-xs"
          onClick={onSearchClick}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </Button>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* Caja status */}
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href="/dashboard/caja">
            <Wallet className="h-3.5 w-3.5" />
            <Badge variant="outline" className="h-4 text-[10px] px-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
              Abierta
            </Badge>
          </Link>
        </Button>

        {/* Tickets — actionable */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                <Link href="/dashboard/soporte">
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 text-[9px] text-white flex items-center justify-center font-bold animate-scale-in">
                    2
                  </span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">2 tickets abiertos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications — actionable */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                <Link href="/dashboard/configuracion/auditoria">
                  <Bell className={`h-4 w-4 text-muted-foreground ${bellShake ? "animate-bell-shake" : ""}`} onAnimationEnd={() => setBellShake(false)} />
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold animate-scale-in">
                    5
                  </span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">5 notificaciones</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* Dark/Light toggle */}
        {mounted && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleDarkMode}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-500 transition-transform hover:-rotate-12" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Theme customizer */}
        <ThemeCustomizer />

        {/* Contextual help */}
        <ContextualHelp />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-[10px] font-bold text-primary ring-1 ring-primary/20">
                A
              </div>
              <span className="hidden md:inline text-xs font-medium">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                A
              </div>
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-muted-foreground">admin@empresa.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion" className="gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/usuarios" className="gap-2">
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
