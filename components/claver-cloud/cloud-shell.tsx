"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, LayoutDashboard, Menu, Server } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CloudBreadcrumbs } from "@/components/claver-cloud/cloud-breadcrumbs"
import { TenantSearch } from "@/components/claver-cloud/tenant-search"
import { cn } from "@/lib/utils"
import { isNavItemActive, navSections } from "@/lib/claver-cloud/nav-config"

function NavLinks({
  pathname,
  onNavigate,
  compact,
}: {
  pathname: string
  onNavigate?: () => void
  compact?: boolean
}) {
  return (
    <>
      {navSections.map((section) => (
        <div key={section.label} className={compact ? "grid gap-2" : "mb-4"}>
          <p
            className={cn(
              "px-3 font-semibold uppercase tracking-wider text-muted-foreground",
              compact ? "text-xs" : "text-[10px] mb-1",
            )}
          >
            {section.label}
          </p>
          {section.items.map((item) => {
            const active = isNavItemActive(pathname, item)
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
                {item.name}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}

function ShellFooterLinks() {
  return (
    <div className="border-t border-border/60 p-3 space-y-1">
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8" asChild>
        <Link href="/dashboard">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Volver al ERP
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground" asChild>
        <Link href="/claver">
          <ExternalLink className="h-3.5 w-3.5" />
          Grupo Claver
        </Link>
      </Button>
    </div>
  )
}

export function CloudShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3 sm:px-6">
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

          <TenantSearch className="ml-auto w-full max-w-[360px]" />
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