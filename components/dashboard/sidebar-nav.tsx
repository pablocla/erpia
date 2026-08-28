"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DashboardMenuItem, DashboardModuloSection } from "@/lib/dashboard/sidebar-modules"

export function SidebarNavItem({
  item,
  depth = 0,
  sidebarOpen = true,
  onNavigate,
}: {
  item: DashboardMenuItem
  depth?: number
  sidebarOpen?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const label = item.translationKey ? t(item.translationKey) : item.label
  const isActive = item.href
    ? item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
    : false

  if (!item.href) return null

  return (
    <Link
      href={item.href}
      className="block"
      title={!sidebarOpen ? label : undefined}
      onClick={onNavigate}
    >
      <Button
        variant="ghost"
        size="sm"
        data-active={isActive ? "true" : "false"}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "sidebar-link w-full",
          sidebarOpen ? "flex items-center gap-3 justify-start" : "flex items-center justify-center",
          depth > 0 && sidebarOpen && "pl-6",
        )}
      >
        <item.icon className="sidebar-icon h-4 w-4 flex-shrink-0" />
        {sidebarOpen && <span className="sidebar-label truncate">{label}</span>}
        {sidebarOpen && item.badge && (
          <Badge
            className={cn(
              "ml-auto h-4 text-[10px] px-1 shrink-0",
              (item.badge === "Extra" || item.badge.includes("🔒") || item.badge.includes("Extra")) &&
                "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
            )}
            variant={
              item.badge === "Piloto"
                ? "secondary"
                : item.badge === "Demo"
                  ? "outline"
                  : item.badge === "No vender"
                    ? "destructive"
                    : item.badge.includes("Extra") || item.badge.includes("🔒")
                      ? "outline"
                      : "secondary"
            }
            title={
              item.badge === "Piloto"
                ? "Módulo en piloto: usable con limitaciones"
                : item.badge === "Demo"
                  ? "Demo / incompleto: no vender como producto cerrado"
                  : item.badge.includes("Extra")
                    ? "Módulo Extra: requiere activación de pack o servicio"
                    : undefined
            }
          >
            {item.badge}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

export function SidebarCollapseSection({
  modulo,
  sidebarOpen,
  defaultExpanded = false,
  onNavigate,
}: {
  modulo: DashboardModuloSection
  sidebarOpen: boolean
  defaultExpanded?: boolean
  onNavigate?: () => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const pathname = usePathname()
  const t = useTranslations("nav")
  const label = modulo.translationKey ? t(modulo.translationKey) : modulo.label
  const items = modulo?.items || []
  const hasActiveChild = items.some(
    (item) =>
      item?.href &&
      (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)),
  )

  useEffect(() => {
    if (hasActiveChild) setExpanded(true)
  }, [hasActiveChild])

  if (!sidebarOpen) {
    return (
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={`${item?.href ?? ""}:${item?.label ?? ""}`}
            item={item}
            sidebarOpen={sidebarOpen}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="sidebar-section-header w-full flex items-center gap-1.5 cursor-pointer select-none transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-200",
            !expanded && "-rotate-90",
          )}
        />
        <span className="flex-1 text-left">{label}</span>
        {hasActiveChild && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
      </button>
      <div
        className={cn(
          "space-y-0.5 transition-[height] duration-200",
          !expanded && "hidden",
        )}
      >
        {items.map((item) => (
          <SidebarNavItem
            key={`${item?.href ?? ""}:${item?.label ?? ""}`}
            item={item}
            depth={1}
            sidebarOpen={sidebarOpen}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}