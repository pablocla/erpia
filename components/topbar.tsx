"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { ContextualHelp } from "@/components/contextual-help"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { LocaleFlagToggle } from "@/components/locale-flag-toggle"
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
  HelpCircle,
  Palette,
} from "lucide-react"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { NotificationCenter, type Notification } from "@/components/notification-center"
import { TrialTopbarPill } from "@/components/dashboard/trial-topbar-pill"
import { ProductContextPill } from "@/components/dashboard/product-context-pill"

interface TopbarProps {
  onSearchClick?: () => void
  /** Solo móvil (<768px): abre drawer de todos los módulos */
  onMenuClick?: () => void
  modoLite?: string
  productosSku?: Record<string, boolean> | null
}

export function Topbar({ onSearchClick, onMenuClick, modoLite, productosSku }: TopbarProps) {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const toggleChatWidget = useUIStore((s) => s.toggleChatWidget)
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])

  // 1) Caja & AFIP Status
  const { data: posData } = useAuthFetch<{ cajaAbierta?: boolean; afip?: { label?: string } }>("/api/pos/venta", {
    refreshInterval: 60_000,
  })
  const cajaAbierta = posData ? Boolean(posData.cajaAbierta) : null
  const afipLabel = posData?.afip?.label ?? null

  // 2) Centro de Alertas
  const { data: alertasData } = useAuthFetch<{ preview?: Array<{ id: string; titulo: string; descripcion?: string; prioridad?: string; createdAt?: string; href?: string }> }>("/api/centro-alertas?preview=true", {
    refreshInterval: 120_000,
  })
  const rawNotifications: Notification[] = (alertasData?.preview ?? []).map((a) => ({
    id: a.id,
    title: a.titulo,
    description: a.descripcion,
    type: a.prioridad === "alta" ? ("alerta" as const) : ("info" as const),
    module: "alertas",
    timestamp: a.createdAt ? new Date(a.createdAt) : new Date(),
    read: readNotificationIds.includes(a.id),
    href: a.href ?? "/dashboard/centro-alertas",
  }))
  const notifications = rawNotifications.filter((n) => !dismissedNotificationIds.includes(n.id))

  const handleMarkRead = (id: string) => setReadNotificationIds((prev) => [...prev, id])
  const handleMarkAllRead = () => setReadNotificationIds(notifications.map((n) => n.id))
  const handleDismiss = (id: string) => setDismissedNotificationIds((prev) => [...prev, id])
  const handleClearAll = () => setDismissedNotificationIds(notifications.map((n) => n.id))

  // 3) Tickets abiertos
  const { data: ticketsData } = useAuthFetch<{ resumen?: { abiertos?: number } }>("/api/tickets/metricas", {
    refreshInterval: 120_000,
  })
  const ticketsAbiertos = ticketsData?.resumen?.abiertos ?? 0

  // 4) Tareas pendientes
  const { data: tareasData } = useAuthFetch<unknown[]>("/api/mis-tareas?incluirCompletadas=false", {
    refreshInterval: 60_000,
  })
  const tareasPendientes = Array.isArray(tareasData) ? tareasData.length : 0

  // 5) Analista Claver Cloud status
  const { data: analystData } = useAuthFetch<{ isAnalyst?: boolean }>("/api/claver/analista/status")
  const isClaverAnalyst = Boolean(analystData?.isAnalyst)

  const handleLogout = useCallback(() => {
    performLogoutAndRedirect("/login")
  }, [])

  const cajaBadge =
    cajaAbierta === null ? (
      <Badge variant="outline" className="h-4 text-[10px] px-1">Caja…</Badge>
    ) : cajaAbierta ? (
      <Badge variant="outline" className="h-4 text-[10px] px-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
        Abierta
      </Badge>
    ) : (
      <Badge variant="outline" className="h-4 text-[10px] px-1 bg-red-500/10 text-red-600 border-red-200">
        Cerrada
      </Badge>
    )

  // Acciones top según pack (nav-matrix mental); SKU refuerza
  const topHints = (() => {
    const m = modoLite || "completo"
    if (m === "cobranza") return { posCaja: false, afip: false }
    if (m === "niche" || m === "servicios") return { posCaja: Boolean(productosSku?.["core.pos"]), afip: true }
    if (m === "fiado") return { posCaja: true, afip: false }
    if (m === "pos") return { posCaja: true, afip: Boolean(productosSku?.["core.facturacion"]) }
    return {
      posCaja: true,
      afip: true,
    }
  })()

  const tieneModuloPosOCaja = Boolean(
    topHints.posCaja ||
    productosSku?.["core.pos"] ||
    productosSku?.["core.caja"]
  )

  const tieneModuloAfip = Boolean(
    topHints.afip ||
    productosSku?.["core.facturacion"]
  )

  return (
    <header className="app-topbar h-[52px] border-b flex items-center justify-between gap-2 px-3 sm:px-5 shrink-0 z-30 relative">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 touch-target shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Todos los módulos</span>
          </Button>
        )}
        <div className="hidden lg:block min-w-0">
          <Breadcrumbs />
        </div>
        <ProductContextPill modoLite={modoLite} productosSku={productosSku} />
        <TrialTopbarPill />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Button
          variant="ghost"
          size={onMenuClick ? "icon" : "sm"}
          className={onMenuClick ? "h-9 w-9 touch-target" : "h-8 gap-2 text-muted-foreground hover:text-foreground text-xs"}
          onClick={() => {
            onSearchClick?.()
            toggleCommandPalette()
          }}
        >
          <Search className="h-3.5 w-3.5" />
          {!onMenuClick && (
            <>
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </>
          )}
        </Button>

        <div className="h-4 w-px bg-border mx-0.5 hidden md:block" />

        <div className="hidden md:flex items-center gap-0.5 sm:gap-1">
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
                  <p className="text-xs">Torre Claver Cloud</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {tieneModuloPosOCaja && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <Link href="/dashboard/caja">
                <Wallet className="h-3.5 w-3.5" />
                {cajaBadge}
              </Link>
            </Button>
          )}

          {tieneModuloAfip && afipLabel && afipLabel !== "AFIP OK" && (
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
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 text-[9px] text-white flex items-center justify-center font-bold">
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

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                  <Link href="/dashboard/soporte">
                    <TicketCheck className="h-4 w-4 text-muted-foreground" />
                    {ticketsAbiertos > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 text-[9px] text-white flex items-center justify-center font-bold">
                        {ticketsAbiertos > 9 ? "9+" : ticketsAbiertos}
                      </span>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{ticketsAbiertos} ticket{ticketsAbiertos !== 1 ? "s" : ""} abierto{ticketsAbiertos !== 1 ? "s" : ""}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative group"
                  onClick={() => toggleChatWidget()}
                >
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Asistente IA (Ctrl+Shift+I)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <LocaleFlagToggle />
          <ThemeCustomizer />
          <ContextualHelp />
        </div>

        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 touch-target">
              <UserAvatar />
              <span className="hidden md:inline text-xs font-medium">
                <UserDisplayName />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 flex items-center gap-2">
              <UserAvatar size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  <UserDisplayName />
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  <UserEmail />
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />

            <div className="md:hidden">
              {tieneModuloPosOCaja && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/caja" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Caja {cajaAbierta ? "(abierta)" : cajaAbierta === false ? "(cerrada)" : ""}
                  </Link>
                </DropdownMenuItem>
              )}
              {tieneModuloAfip && afipLabel && afipLabel !== "AFIP OK" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/configuracion?seccion=afip" className="gap-2">
                    <Badge variant="outline" className="text-[10px]">{afipLabel}</Badge>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/mis-tareas" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Mis tareas{tareasPendientes > 0 ? ` (${tareasPendientes})` : ""}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/soporte" className="gap-2">
                  <TicketCheck className="h-4 w-4" />
                  Soporte{ticketsAbiertos > 0 ? ` (${ticketsAbiertos})` : ""}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  toggleChatWidget()
                }}
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                Asistente IA
              </DropdownMenuItem>
              {isClaverAnalyst && (
                <DropdownMenuItem asChild>
                  <Link href="/claver-cloud" className="gap-2 text-violet-600">
                    <Cloud className="h-4 w-4" />
                    Claver Cloud
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracion" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Tema y personalización
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/soporte" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Ayuda y soporte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

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

  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.nombre ?? "Usuario"}
        className={`${dim} rounded-full object-cover ring-1 ring-primary/20`}
        referrerPolicy="no-referrer"
      />
    )
  }

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