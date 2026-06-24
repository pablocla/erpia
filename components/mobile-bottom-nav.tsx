"use client"

/**
 * Mobile Bottom Navigation — navegación por rol en pantallas < 768px.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Package,
  ClipboardCheck,
  MoreHorizontal,
  Users,
  BarChart3,
  Truck,
  FileText,
  Scissors,
  Store,
  ScanLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useState, useMemo } from "react"

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  badge?: boolean
}

const MORE_ITEMS_DEFAULT = [
  { href: "/dashboard/productos", icon: Package, label: "Productos" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { href: "/dashboard/peluqueria", icon: Scissors, label: "Peluquería" },
  { href: "/dashboard/stock", icon: Truck, label: "Stock" },
  { href: "/dashboard/facturas", icon: FileText, label: "Facturas" },
  { href: "/dashboard/kpis", icon: BarChart3, label: "KPIs" },
]

const MORE_ITEMS_CAJERO = [
  { href: "/dashboard/facturas", icon: FileText, label: "Facturas" },
  { href: "/dashboard/productos", icon: Package, label: "Productos" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio ERP" },
  { href: "/dashboard/mis-tareas", icon: ClipboardCheck, label: "Tareas" },
]

const MORE_ITEMS_DEPOSITO = [
  { href: "/dashboard/stock", icon: Truck, label: "Stock" },
  { href: "/dashboard/productos", icon: Package, label: "Productos" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
]

const NAV_BY_ROL: Record<string, NavItem[]> = {
  cajero: [
    { href: "/dashboard/pos", icon: Store, label: "POS" },
    { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
    { href: "/dashboard/pos/cierre", icon: BarChart3, label: "Cierre" },
    { href: "#more", icon: MoreHorizontal, label: "Más" },
  ],
  deposito: [
    { href: "/dashboard/picking", icon: ScanLine, label: "Picking" },
    { href: "/dashboard/stock", icon: Truck, label: "Stock" },
    { href: "/dashboard/productos", icon: Package, label: "Productos" },
    { href: "#more", icon: MoreHorizontal, label: "Más" },
  ],
}

const DEFAULT_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/pos", icon: Store, label: "POS" },
  { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
  { href: "/dashboard/aprobaciones-mobile", icon: ClipboardCheck, label: "Aprobar", badge: true },
  { href: "#more", icon: MoreHorizontal, label: "Más" },
]

function moreItemsForRol(rol: string) {
  if (rol === "cajero") return MORE_ITEMS_CAJERO
  if (rol === "deposito") return MORE_ITEMS_DEPOSITO
  return MORE_ITEMS_DEFAULT
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const rol = useAuthStore((s) => s.user?.rol ?? "")
  const [showMore, setShowMore] = useState(false)
  const { data: aprobData } = useAuthFetch<{ data: { length: number }[] }>(
    "/api/aprobaciones?estado=pendiente&take=1"
  )
  const pendingCount = aprobData?.data?.length ?? 0

  const items = useMemo(
    () => NAV_BY_ROL[rol] ?? DEFAULT_ITEMS,
    [rol]
  )
  const moreItems = useMemo(() => moreItemsForRol(rol), [rol])

  return (
    <>
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="absolute bottom-16 inset-x-2 bg-background rounded-2xl border shadow-xl p-3 safe-area-pb">
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted active:scale-95 transition-all touch-manipulation"
                >
                  <item.icon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-[3.75rem] max-w-lg mx-auto">
          {items.map((item) => {
            const isMore = item.href === "#more"
            const isActive = isMore
              ? showMore
              : item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)

            return isMore ? (
              <button
                key={item.href}
                onClick={() => setShowMore(!showMore)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  "active:scale-95 touch-manipulation min-h-[44px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", isActive && "drop-shadow-sm")} />
                <span className={cn("text-[10px] leading-none", isActive ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  "active:scale-95 touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                  {item.badge && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-medium",
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}