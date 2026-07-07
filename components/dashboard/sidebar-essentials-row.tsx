"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getSidebarEssentials } from "@/lib/dashboard/sidebar-essentials"

export function SidebarEssentialsRow({
  rol,
  sidebarOpen,
  onNavigate,
}: {
  rol?: string | null
  sidebarOpen: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const items = getSidebarEssentials(rol)

  if (!sidebarOpen) {
    return (
      <div className="px-1 pb-2 space-y-0.5 border-b border-border/40 mb-1">
        {items.slice(0, 4).map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="px-2 pb-2 border-b border-border/40 mb-1">
      <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Accesos rápidos
      </p>
      <div className="grid grid-cols-2 gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}