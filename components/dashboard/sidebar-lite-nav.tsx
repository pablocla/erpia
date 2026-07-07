"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, LayoutGrid, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ProductShellConfig } from "@/lib/comercial/product-shell"

const MI_PLAN_HREF = "/dashboard/mi-plan"
const APPS_HREF = "/dashboard/apps"

export function SidebarLiteNav({
  shell,
  sidebarOpen = true,
  onNavigate,
}: {
  shell: ProductShellConfig
  sidebarOpen?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const tabs = shell.tabs.filter((tab) => tab.href !== "#more")
  const extra = [
    { href: MI_PLAN_HREF, icon: CreditCard, label: "Mi plan" },
    { href: APPS_HREF, icon: LayoutGrid, label: "Más apps" },
  ]

  const items = [...tabs, ...extra]

  return (
    <nav className="px-2 pb-3 space-y-0.5">
      {sidebarOpen && (
        <p className="sidebar-section-header px-2 mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {shell.marca}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            title={!sidebarOpen ? item.label : undefined}
            onClick={onNavigate}
            className="block"
          >
            <Button
              variant="ghost"
              size="sm"
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "sidebar-link w-full",
                sidebarOpen ? "flex items-center gap-3 justify-start" : "flex items-center justify-center",
                item.href === MI_PLAN_HREF && "text-primary font-medium",
              )}
            >
              <item.icon className="sidebar-icon h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="sidebar-label truncate">{item.label}</span>}
            </Button>
          </Link>
        )
      })}
      {sidebarOpen && (
        <p className="px-2 pt-2 text-[10px] text-muted-foreground leading-snug">
          Menú reducido para {shell.marca}. Sumá POS y más módulos desde Mi plan.
        </p>
      )}
      {!sidebarOpen && (
        <Link href={APPS_HREF} title="Más apps" onClick={onNavigate} className="block">
          <Button variant="ghost" size="sm" className="sidebar-link w-full flex items-center justify-center">
            <MoreHorizontal className="sidebar-icon h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  )
}