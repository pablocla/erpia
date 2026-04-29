"use client"

/**
 * Mobile Bottom Navigation — Sticky footer for core modules on mobile.
 *
 * Only visible on screens < 768px. Provides quick access to:
 * Dashboard, Ventas, Caja, Productos, Aprobaciones.
 * Shows badge count on Aprobaciones when pending items exist.
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { useState } from "react"

const ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/ventas", icon: Receipt, label: "Ventas" },
  { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
  { href: "/dashboard/aprobaciones-mobile", icon: ClipboardCheck, label: "Aprobar", badge: true },
  { href: "#more", icon: MoreHorizontal, label: "Más" },
]

const MORE_ITEMS = [
  { href: "/dashboard/productos", icon: Package, label: "Productos" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { href: "/dashboard/peluqueria", icon: Scissors, label: "Peluquería" },
  { href: "/dashboard/stock", icon: Truck, label: "Stock" },
  { href: "/dashboard/facturas", icon: FileText, label: "Facturas" },
  { href: "/dashboard/kpis", icon: BarChart3, label: "KPIs" },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const { data: aprobData } = useAuthFetch<{ data: { length: number }[] }>("/api/aprobaciones?estado=pendiente&take=1")
  const pendingCount = aprobData?.data?.length ?? 0

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="absolute bottom-16 inset-x-2 bg-background rounded-2xl border shadow-xl p-3 safe-area-pb">
            <div className="grid grid-cols-3 gap-2">
              {MORE_ITEMS.map((item) => (
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

      {/* Bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {ITEMS.map((item) => {
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
                  "active:scale-95 touch-manipulation",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
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
