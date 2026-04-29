"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { ContextualHelp } from "@/components/contextual-help"
import { Breadcrumbs } from "@/components/breadcrumbs"
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
  Sparkles,
  CheckSquare,
  Menu,
} from "lucide-react"

import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { NotificationCenter, type Notification } from "@/components/notification-center"

interface TopbarProps {
  onSearchClick?: () => void
  onMenuClick?: () => void
}

export function Topbar({ onSearchClick, onMenuClick }: TopbarProps) {
  const [bellShake, setBellShake] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const toggleChatWidget = useUIStore((s) => s.toggleChatWidget)
  const [tareasPendientes, setTareasPendientes] = useState(0)

  useEffect(() => {
    const cargarTareas = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/mis-tareas?incluirCompletadas=false", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setTareasPendientes(Array.isArray(data) ? data.length : 0)
        }
      } catch { /* silencioso */ }
    }
    void cargarTareas()
    const interval = setInterval(() => void cargarTareas(), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", title: "Stock bajo en Producto A", description: "Solo quedan 3 unidades disponibles", type: "alerta", module: "stock", timestamp: new Date(Date.now() - 300_000), read: false, href: "/dashboard/productos" },
    { id: "2", title: "Venta #1042 completada", description: "Total: $54.200,00", type: "exito", module: "ventas", timestamp: new Date(Date.now() - 1_800_000), read: false },
    { id: "3", title: "Factura #B-0012 vence mañana", type: "vencimiento", module: "ventas", timestamp: new Date(Date.now() - 3_600_000), read: false, href: "/dashboard/cuentas-cobrar" },
    { id: "4", title: "Backup completado", description: "Respaldo automático exitoso", type: "sistema", timestamp: new Date(Date.now() - 7_200_000), read: true },
    { id: "5", title: "Nueva versión disponible", description: "v2.1.0 incluye mejoras de facturación", type: "info", timestamp: new Date(Date.now() - 86_400_000), read: true },
  ])

  const handleMarkRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  const handleMarkAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const handleDismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))
  const handleClearAll = () => setNotifications([])

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
    <header className="h-14 border-b border-border/40 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30 flex items-center justify-between px-6 shrink-0 animate-fade-in shadow-sm z-30 relative">
      {/* Subtle top glare */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        )}
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-foreground text-xs"
          onClick={() => { onSearchClick?.(); toggleCommandPalette() }}
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

        {/* Mis Tareas — indicador */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                <Link href="/dashboard/mis-tareas">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  {tareasPendientes > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 text-[9px] text-white flex items-center justify-center font-bold animate-scale-in">
                      {tareasPendientes > 9 ? "9+" : tareasPendientes}
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{tareasPendientes} tarea{tareasPendientes !== 1 ? "s" : ""} pendiente{tareasPendientes !== 1 ? "s" : ""}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

        {/* Notifications — interactive center */}
        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />

        {/* AI Assistant */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative group"
                onClick={() => toggleChatWidget()}
              >
                <Sparkles className="h-4 w-4 text-purple-500 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Asistente IA (Ctrl+Shift+I)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
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
              <UserAvatar />
              <span className="hidden md:inline text-xs font-medium"><UserDisplayName /></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2 flex items-center gap-2">
              <UserAvatar size="lg" />
              <div>
                <p className="text-sm font-medium"><UserDisplayName /></p>
                <p className="text-xs text-muted-foreground"><UserEmail /></p>
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

/* ── Auth-aware avatar helpers ─────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function UserAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const user = useAuthStore((s) => s.user)
  const initials = user?.nombre ? getInitials(user.nombre) : "U"
  const dim = size === "lg" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]"
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary ring-1 ring-primary/20`}
    >
      {initials}
    </div>
  )
}

function UserDisplayName() {
  const user = useAuthStore((s) => s.user)
  return <>{user?.nombre ?? "Usuario"}</>
}

function UserEmail() {
  const user = useAuthStore((s) => s.user)
  return <>{user?.email ?? "—"}</>
}
