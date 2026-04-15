"use client"

/**
 * EmptyStateIllustration — Illustrated empty states for different modules.
 *
 * SVG inline illustrations that adapt to theme colors.
 * Competitors: Odoo, Zoho Books, Colppy — all use illustrated empty states.
 */

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package, Users, FileText, Receipt, Wallet,
  ShoppingCart, BarChart3, Bell, Search, Plus,
  FolderOpen,
} from "lucide-react"

export type EmptyStateType =
  | "productos"
  | "clientes"
  | "facturas"
  | "ventas"
  | "compras"
  | "caja"
  | "reportes"
  | "notificaciones"
  | "busqueda"
  | "generico"

const ILLUSTRATIONS: Record<EmptyStateType, {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
}> = {
  productos: {
    icon: Package,
    title: "Sin productos cargados",
    description: "Agregá tu primer producto para empezar a facturar y controlar stock.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  clientes: {
    icon: Users,
    title: "Sin clientes",
    description: "Cargá tus clientes para emitir facturas y llevar el seguimiento comercial.",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  facturas: {
    icon: FileText,
    title: "Sin comprobantes",
    description: "Las facturas emitidas aparecerán acá. Creá tu primera venta para comenzar.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  ventas: {
    icon: Receipt,
    title: "Sin ventas registradas",
    description: "Empezá a facturar para ver tus ventas, métricas y tendencias.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  compras: {
    icon: ShoppingCart,
    title: "Sin compras registradas",
    description: "Cargá facturas de proveedores para controlar egresos y stock.",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  caja: {
    icon: Wallet,
    title: "Sin movimientos de caja",
    description: "Abrí una caja y registrá cobros para ver los movimientos.",
    gradient: "from-violet-500/20 to-indigo-500/20",
  },
  reportes: {
    icon: BarChart3,
    title: "Sin datos para reportar",
    description: "Los reportes se generarán cuando haya transacciones registradas.",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
  notificaciones: {
    icon: Bell,
    title: "Sin notificaciones",
    description: "Todo está al día. Las alertas y avisos aparecerán acá.",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  busqueda: {
    icon: Search,
    title: "Sin resultados",
    description: "Probá con otro término de búsqueda o ajustá los filtros.",
    gradient: "from-slate-500/20 to-gray-500/20",
  },
  generico: {
    icon: FolderOpen,
    title: "Sin datos",
    description: "No hay registros para mostrar todavía.",
    gradient: "from-slate-500/20 to-gray-500/20",
  },
}

interface EmptyStateIllustrationProps {
  type?: EmptyStateType
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  className?: string
  compact?: boolean
}

export function EmptyStateIllustration({
  type = "generico",
  title: customTitle,
  description: customDescription,
  actionLabel,
  onAction,
  actionHref,
  className,
  compact = false,
}: EmptyStateIllustrationProps) {
  const config = ILLUSTRATIONS[type]
  const Icon = config.icon
  const title = customTitle ?? config.title
  const description = customDescription ?? config.description

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 gap-3" : "py-16 gap-4",
      className,
    )}>
      {/* Illustrated icon with gradient background */}
      <div className={cn(
        "relative rounded-2xl bg-gradient-to-br p-6",
        config.gradient,
      )}>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute -bottom-2 -left-2 h-2 w-2 rounded-full bg-primary/10 animate-pulse delay-300" />
        <div className="absolute top-1/2 -right-3 h-1.5 w-1.5 rounded-full bg-primary/15 animate-pulse delay-700" />

        <Icon className={cn(
          "text-muted-foreground/60",
          compact ? "h-8 w-8" : "h-12 w-12",
        )} />
      </div>

      <div className="max-w-sm space-y-1.5">
        <h3 className={cn(
          "font-semibold text-foreground",
          compact ? "text-sm" : "text-lg",
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-muted-foreground",
          compact ? "text-xs" : "text-sm",
        )}>
          {description}
        </p>
      </div>

      {(actionLabel || actionHref) && (
        actionHref ? (
          <Button size={compact ? "sm" : "default"} asChild>
            <a href={actionHref}>
              <Plus className="h-4 w-4 mr-1.5" />
              {actionLabel ?? "Crear"}
            </a>
          </Button>
        ) : (
          <Button size={compact ? "sm" : "default"} onClick={onAction}>
            <Plus className="h-4 w-4 mr-1.5" />
            {actionLabel ?? "Crear"}
          </Button>
        )
      )}
    </div>
  )
}
