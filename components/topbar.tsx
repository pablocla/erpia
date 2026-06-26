"use client"

import { useState, useEffect, useCallback } from "react"
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
  Search,
  TicketCheck,
  Wallet,
  LogOut,
  Settings,
  User,
  Sparkles,
  CheckSquare,
  Menu,
  Cloud,
} from "lucide-react"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { NotificationCenter, type Notification } from "@/components/notification-center"

interface TopbarProps {
  onSearchClick?: () => void
  onMenuClick?: () => void
}

export function Topbar({ onSearchClick, onMenuClick }: TopbarProps) {

  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const toggleChatWidget = useUIStore((s) => s.toggleChatWidget)
  const [tareasPendientes, setTareasPendientes] = useState(0)
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [afipLabel, setAfipLabel] = useState<string | null>(null)
  const [ticketsAbiertos, setTicketsAbiertos] = useState(0)
  const [isClaverAnalyst, setIsClaverAnalyst] = useState(false)

  const handleMarkRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  const handleMarkAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const handleDismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  const handleClearAll = () => setNotifications([])

  useEffect(() => {
    const cargarCaja = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/pos/venta", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCajaAbierta(Boolean(data.cajaAbierta))
          setAfipLabel(data.afip?.label ?? null)
        }
      } catch {
        /* silencioso */
      }
    }
    void cargarCaja()
    const interval = setInterval(() => void cargarCaja(), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cargarAlertas = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/centro-alertas?preview=true", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const items = data.preview ?? []
        setNotifications(
          items.map((a: { id: string; titulo: string; descripcion?: string; prioridad?: string; createdAt?: string; href?: string }) => ({
            id: a.id,
            title: a.titulo,
            description: a.descripcion,
            type: a.prioridad === "alta" ? "alerta" as const : "info" as const,
            module: "alertas",
            timestamp: a.createdAt ? new Date(a.createdAt) : new Date(),
            read: false,
            href: a.href ?? "/dashboard/centro-alertas",
          })),
        )
      } catch {
        /* silencioso */
      }
    }
    void cargarAlertas()
    const interval = setInterval(() => void cargarAlertas(), 120_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cargarTickets = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/tickets/metricas", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setTicketsAbiertos(data.resumen?.abiertos ?? 0)
        }
      } catch {
        /* silencioso */
      }
    }
    void cargarTickets()
    const interval = setInterval(() => void cargarTickets(), 120_000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = useCallback(() => {
    performLogoutAndRedirect("/login")
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch("/api/claver/analista/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsClaverAnalyst(Boolean(data?.isAnalyst)))
      .catch(() => setIsClaverAnalyst(false))
  }, [])

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
      } catch {
        /* silencioso */
      }
    }
    void cargarTareas()
    const interval = setInterval(() => void cargarTareas(), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="app-topbar h-14 border-b border-border/40 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30 flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0 animate-fade-in shadow-sm z-30 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 touch-target"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        )}
        <div className="hidden lg:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-foreground text-xs"
          onClick={() => {
            onSearchClick?.()
            toggleCommandPalette()
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </Button>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {isClaverAnalyst && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs hidden md:inline-flex text-violet-600 hover:text-violet-700 hover:bg-violet-500/10"
                  asChild
                >
                  <Link href="/claver-cloud">
                    <Cloud className="h-3.5 w-3.5" />
                    <span>Cloud</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Torre Claver Cloud — provisioning y operaciones</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href="/dashboard/caja">
            <Wallet className="h-3.5 w-3.5" />
            {cajaAbierta === null ? (
              <Badge variant="outline" className="h-4 text-[10px] px-1">
                Caja…
              </Badge>
            ) : cajaAbierta ? (
              <Badge variant="outline" className="h-4 text-[10px] px-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                Abierta
              </Badge>
            ) : (
              <Badge variant="outline" className="h-4 text-[10px] px-1 bg-red-500/10 text-red-600 border-red-200">
                Cerrada
              </Badge>
            )}
          </Link>
        </Button>

        {afipLabel && afipLabel !== "AFIP OK" && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs hidden lg:inline-flex" asChild>
            <Link href="/dashboard/configuracion?seccion=afip">
              <Badge variant="outline" className="h-4 text-[10px] px-1.5 bg-amber-500/10 text-amber-800 border-amber-200">
                {afipLabel}
              </Badge>
            </Link>
          </Button>
        )}

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
              <p className="text-xs">
                {tareasPendientes} tarea{tareasPendientes !== 1 ? "s" : ""} pendiente
                {tareasPendientes !== 1 ? "s" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                <Link href="/dashboard/soporte">
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                  {ticketsAbiertos > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 text-[9px] text-white flex items-center justify-center font-bold animate-scale-in">
                      {ticketsAbiertos > 9 ? "9+" : ticketsAbiertos}
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                {ticketsAbiertos} ticket{ticketsAbiertos !== 1 ? "s" : ""} abierto{ticketsAbiertos !== 1 ? "s" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />

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

        <ThemeCustomizer />
        <ContextualHelp />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <UserAvatar />
              <span className="hidden md:inline text-xs font-medium">
                <UserDisplayName />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2 flex items-center gap-2">
              <UserAvatar size="lg" />
              <div>
                <p className="text-sm font-medium">
                  <UserDisplayName />
                </p>
                <p className="text-xs text-muted-foreground">
                  <UserEmail />
                </p>
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
            {isClaverAnalyst && (
              <DropdownMenuItem asChild>
                <Link href="/claver-cloud" className="gap-2 text-violet-600 focus:text-violet-600">
                  <Cloud className="h-4 w-4" />
                  Claver Cloud
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                handleLogout()
              }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

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