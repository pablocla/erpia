"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Rocket,
  Server,
  Shield,
} from "lucide-react"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { ExperienceSwitcher } from "@/components/ops/experience-switcher"
import { PreviewExperienceBanner } from "@/components/ops/preview-experience-banner"
import { LiveDeploymentStatusPill } from "@/components/claver-cloud/live-deployment-status"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CloudBreadcrumbs } from "@/components/claver-cloud/cloud-breadcrumbs"
import { TenantSearch } from "@/components/claver-cloud/tenant-search"
import { LocaleFlagToggle } from "@/components/locale-flag-toggle"
import { cn } from "@/lib/utils"
import { isNavItemActive, navSections } from "@/lib/claver-cloud/nav-config"

import { useTranslations } from "next-intl"

const SECTION_FALLBACKS: Record<string, string> = {
  negocio: "Negocio & Ventas",
  platform: "Plataforma & Operaciones",
  integraciones: "Integraciones & OPO",
  admin: "Administración",
  ceo: "Dirección General",
  protheus: "Protheus / OPO",
}

const ITEM_FALLBACKS: Record<string, string> = {
  commandCenter: "Centro de Mando",
  analytics: "Métricas & MRR",
  webRegistrations: "Registros & Trials",
  salesPipeline: "Pipeline Ventas",
  upgradesArca: "Certificados ARCA",
  billing: "Facturación Claver",
  partnersPayouts: "Partners & Cash",
  fleet: "Flota de Tenants",
  tenants: "Tenants & Flota",
  provisioning: "Provisioning",
  goLive: "Go-Live PRD",
  marketplace: "Marketplace",
  platformHealth: "Salud de Plataforma",
  setupProtheus: "Setup Protheus",
  opoConsole: "Consola OPO",
  settings: "Configuración",
  superAdmin: "Super Admin",
  operations: "Operaciones",
  implementation: "Implementación",
}

function NavLinks({
  pathname,
  onNavigate,
  compact,
}: {
  pathname: string
  onNavigate?: () => void
  compact?: boolean
}) {
  const t = useTranslations("cloudNav")

  return (
    <>
      {navSections.map((section) => {
        let sectionLabel = SECTION_FALLBACKS[section.label] || section.label
        try {
          const trans = t(`sections.${section.label}` as any)
          if (trans && !trans.includes("cloudNav.")) sectionLabel = trans
        } catch {}

        return (
          <div key={section.label} className={compact ? "grid gap-2" : "mb-4"}>
            <p
              className={cn(
                "px-3 font-semibold uppercase tracking-wider text-muted-foreground",
                compact ? "text-xs" : "text-[10px] mb-1",
              )}
            >
              {sectionLabel}
            </p>
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item)
              let itemLabel = ITEM_FALLBACKS[item.name] || item.name
              try {
                const trans = t(`items.${item.name}` as any)
                if (trans && !trans.includes("cloudNav.")) itemLabel = trans
              } catch {}

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg transition-all",
                    compact ? "gap-4 px-2.5 py-1.5 text-base" : "px-3 py-2 text-sm",
                    active
                      ? compact
                        ? "text-violet-300 font-medium"
                        : "bg-violet-500/10 text-violet-300 font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <item.icon className={compact ? "h-5 w-5" : "h-4 w-4 shrink-0"} />
                  {itemLabel}
                </Link>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

function ShellFooterLinks() {
  return (
    <div className="border-t border-border/60 p-3 space-y-1">
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8" asChild>
        <Link href="/claver-cloud/tenants">
          <Building2 className="h-3.5 w-3.5 text-violet-400" />
          Flota Tenants · Impersonar
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground" asChild>
        <Link href="/claver-cloud/go-live">
          <Rocket className="h-3.5 w-3.5 text-emerald-400" />
          Go-Live PRD Checklist
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground" asChild>
        <Link href="/claver-cloud/platform-health">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          Salud de Plataforma
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs h-8 text-destructive hover:text-destructive"
        onClick={() => performLogoutAndRedirect("/login")}
      >
        <LogOut className="h-3.5 w-3.5" />
        Cerrar sesión
      </Button>
    </div>
  )
}

export function CloudShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PreviewExperienceBanner />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs dark w-[280px] overflow-y-auto">
              <Link
                href="/claver-cloud"
                onClick={() => setMobileOpen(false)}
                className="mb-6 flex items-center gap-2 font-semibold"
              >
                <Server className="h-5 w-5 text-violet-400" />
                Claver Cloud
              </Link>
              <nav className="grid gap-1">
                <NavLinks pathname={pathname} compact onNavigate={() => setMobileOpen(false)} />
              </nav>
              <div className="mt-6">
                <ShellFooterLinks />
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden sm:block min-w-0 flex-1">
            <CloudBreadcrumbs />
          </div>

          <div className="flex items-center gap-2.5 ml-auto shrink-0">
            <LiveDeploymentStatusPill />
            <ExperienceSwitcher forceShow className="shrink-0" />
            <LocaleFlagToggle />
            <TenantSearch className="w-full max-w-[240px] lg:max-w-[320px]" />
          </div>
        </div>
        <div className="mt-2 sm:hidden">
          <CloudBreadcrumbs />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden sm:flex w-60 flex-col border-r border-border/60 bg-sidebar/50 shrink-0">
          <div className="flex h-14 items-center border-b border-border/60 px-4 lg:h-[56px]">
            <Link href="/claver-cloud" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                <Server className="h-4 w-4 text-violet-400" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm">Claver Cloud</span>
                <span className="block text-[10px] font-normal text-muted-foreground">Torre de operaciones</span>
              </div>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-3">
            <nav className="px-2 lg:px-3">
              <NavLinks pathname={pathname} />
            </nav>
          </div>
          <ShellFooterLinks />
        </aside>

        <main className="cloud-main flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}