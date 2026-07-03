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
          <Badge className="ml-auto h-4 text-[10px] px-1" variant="secondary">
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
  const hasActiveChild = modulo.items.some(
    (item) =>
      item.href &&
      (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)),
  )

  useEffect(() => {
    if (hasActiveChild) setExpanded(true)
  }, [hasActiveChild])

  if (!sidebarOpen) {
    return (
      <div className="space-y-0.5">
        {modulo.items.map((item) => (
          <SidebarNavItem
            key={`${item.href ?? ""}:${item.label}`}
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
          "sidebar-collapse-content overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
          expanded ? "max-h-[2000px] opacity-100 mt-0.5" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="sidebar-section-items">
          {modulo.items.map((item) => (
            <SidebarNavItem
              key={`${item.href ?? ""}:${item.label}`}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}