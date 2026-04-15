"use client"

/**
 * Notification Center — Bell dropdown + notification list
 *
 * Displays real-time notifications: alerts, system events, overdue items.
 * Replaces the static bell icon in topbar.
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Package,
  DollarSign,
  Users,
  FileText,
  Wrench,
  X,
  Check,
  BellOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  title: string
  description?: string
  type: "alerta" | "info" | "exito" | "vencimiento" | "sistema"
  module?: string
  timestamp: Date
  read: boolean
  href?: string
  actionLabel?: string
  onAction?: () => void
}

const TYPE_CONFIG = {
  alerta: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-l-amber-500",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-l-blue-500",
  },
  exito: {
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-l-emerald-500",
  },
  vencimiento: {
    icon: Clock,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-l-red-500",
  },
  sistema: {
    icon: Info,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-l-violet-500",
  },
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  stock: Package,
  ventas: DollarSign,
  compras: FileText,
  clientes: Users,
  mantenimiento: Wrench,
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "hace un momento"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDismiss?: (id: string) => void
  onClearAll?: () => void
}

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell
            className={cn(
              "h-4 w-4 text-muted-foreground transition-colors",
              unreadCount > 0 && "text-foreground",
            )}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold px-1 animate-scale-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onMarkAllRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todo leído
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Sin notificaciones</p>
              <p className="text-xs">Todo está al día</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type]
                const TypeIcon = config.icon
                const ModIcon = notif.module ? MODULE_ICONS[notif.module] : undefined

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-l-2 transition-colors hover:bg-muted/50",
                      config.border,
                      !notif.read && "bg-primary/[0.02]",
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", config.bg)}>
                      <TypeIcon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notif.read ? "font-semibold" : "font-medium text-muted-foreground",
                        )}>
                          {notif.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100"
                          onClick={() => onDismiss?.(notif.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {notif.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(notif.timestamp)}
                        </span>
                        {notif.module && ModIcon && (
                          <Badge variant="outline" className="h-4 text-[9px] gap-0.5 px-1">
                            <ModIcon className="h-2.5 w-2.5" />
                            {notif.module}
                          </Badge>
                        )}
                        {notif.actionLabel && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-4 text-[10px] px-0 text-primary"
                            onClick={() => {
                              notif.onAction?.()
                              onMarkRead?.(notif.id)
                            }}
                          >
                            {notif.actionLabel}
                          </Button>
                        )}
                        {!notif.read && (
                          <button
                            className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0"
                            title="Marcar como leída"
                            onClick={() => onMarkRead?.(notif.id)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 flex items-center justify-between">
            <Button
              variant="link"
              size="sm"
              className="h-7 text-xs px-0"
              asChild
            >
              <a href="/dashboard/configuracion/auditoria">Ver todo el historial</a>
            </Button>
            {onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={onClearAll}
              >
                Limpiar todo
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
