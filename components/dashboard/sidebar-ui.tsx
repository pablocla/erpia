"use client"

import { Search, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClavergrowIcon } from "@/components/marketing/brand-logo"
import { Store } from "lucide-react"
import type { DashboardBranding } from "@/lib/brand"

export function SidebarSearch({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn("px-3 pb-2", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar"
          className="sidebar-search h-9 pl-9 text-[13px] rounded-full border-0 bg-muted/50 shadow-none focus-visible:ring-2 focus-visible:ring-primary/15 placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  )
}

export function SidebarBrand({
  branding,
  logoUrl,
  compact,
}: {
  branding: DashboardBranding
  logoUrl: string | null
  compact?: boolean
}) {
  const isGrow = branding.productLine === "clavergrow"

  if (compact) {
    return (
      <div className="flex justify-center py-1">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-9 rounded-[10px] object-cover shrink-0 shadow-sm ring-1 ring-black/5"
          />
        ) : isGrow ? (
          <div className="h-9 w-9 rounded-[10px] bg-emerald-500/10 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/15">
            <ClavergrowIcon size={24} theme="light" />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
            <Store className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-10 w-10 rounded-[11px] object-cover shrink-0 shadow-sm ring-1 ring-black/5"
        />
      ) : isGrow ? (
        <div className="h-10 w-10 rounded-[11px] bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/15 shadow-sm">
          <ClavergrowIcon size={26} theme="light" />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-[11px] bg-gradient-to-br from-primary/12 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10 shadow-sm">
          <Store className="h-[18px] w-[18px] text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            "text-[15px] font-semibold truncate leading-tight tracking-tight",
            isGrow ? "text-emerald-700 dark:text-emerald-400" : "text-foreground",
          )}
        >
          {branding.title}
        </h2>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
          {branding.showLiveIndicator ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {branding.liveLabel}
            </span>
          ) : (
            branding.subtitle
          )}
        </p>
      </div>
    </div>
  )
}

export function SidebarUserFooter({
  nombre,
  email,
  onLogout,
}: {
  nombre?: string | null
  email?: string | null
  onLogout: () => void
}) {
  const initial = (nombre?.trim()?.[0] ?? email?.trim()?.[0] ?? "U").toUpperCase()

  return (
    <div className="sidebar-user-footer p-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2.5 mb-2 ring-1 ring-border/40">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate leading-tight">{nombre ?? "Usuario"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{email ?? "—"}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground h-8 text-[13px] rounded-lg hover:bg-muted/60"
        onClick={onLogout}
      >
        <LogOut className="h-3.5 w-3.5" />
        Cerrar sesión
      </Button>
    </div>
  )
}