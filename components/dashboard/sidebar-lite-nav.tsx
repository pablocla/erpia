"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, LayoutGrid, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaywallModal } from "@/components/billing/paywall-modal"
import type { DisparoKey } from "@/lib/comercial/paywall-disparo"
import type { ProductShellConfig, ProductShellTab } from "@/lib/comercial/product-shell"

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
  const [disparo, setDisparo] = useState<DisparoKey | null>(null)

  const tabs = shell.tabs.filter((tab) => tab.href !== "#more")
  const isFumigacion = shell.slug === "fumigacion"
  const extra: ProductShellTab[] = isFumigacion ? [] : [
    { href: MI_PLAN_HREF, icon: CreditCard, label: "Mi plan" },
    { href: APPS_HREF, icon: LayoutGrid, label: "Más apps" },
  ]

  const items: ProductShellTab[] = [...tabs, ...extra]

  return (
    <nav className="px-2 pb-3 space-y-0.5">
      {sidebarOpen && (
        <p className="sidebar-section-header px-2 mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {shell.marca}
        </p>
      )}
      {items.map((item: ProductShellTab) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const esExtra = item.badge === "Extra" || Boolean(item.disparo)

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={esExtra ? "#" : item.href}
            title={!sidebarOpen ? item.label : undefined}
            onClick={(e) => {
              if (esExtra && item.disparo) {
                e.preventDefault()
                setDisparo(item.disparo)
                return
              }
              onNavigate?.()
            }}
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
              {sidebarOpen && esExtra && (
                <Badge
                  variant="outline"
                  className="ml-auto h-4 text-[10px] px-1 shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                >
                  Extra
                </Badge>
              )}
            </Button>
          </Link>
        )
      })}
      {sidebarOpen && !isFumigacion && (
        <p className="px-2 pt-2 text-[10px] text-muted-foreground leading-snug">
          Menú reducido para {shell.marca}. Sumá POS y más módulos desde Mi plan.
        </p>
      )}
      <PaywallModal
        open={Boolean(disparo)}
        onOpenChange={(open) => {
          if (!open) setDisparo(null)
        }}
        disparoKey={disparo ?? undefined}
      />
      {!sidebarOpen && !isFumigacion && (
        <Link href={APPS_HREF} title="Más apps" onClick={onNavigate} className="block">
          <Button variant="ghost" size="sm" className="sidebar-link w-full flex items-center justify-center">
            <MoreHorizontal className="sidebar-icon h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  )
}