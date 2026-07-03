"use client"

import type React from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Topbar } from "@/components/topbar"
import { ImpersonationBanner } from "@/components/ops/impersonation-banner"
import { CajasAbiertasAlert } from "@/components/caja/cajas-abiertas-alert"
import { DraftAlert } from "@/components/ventas/draft-alert"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MotionPage, MotionPresence } from "@/components/ui/motion"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { RecentlyViewed } from "@/components/recently-viewed"
import { SidebarBrand, SidebarSearch, SidebarUserFooter } from "@/components/dashboard/sidebar-ui"
import { SidebarCollapseSection } from "@/components/dashboard/sidebar-nav"
import { TrialBanner } from "@/components/trial-banner"
import { OnboardingTour } from "@/components/onboarding-tour"
import { useDashboardShell } from "@/hooks/use-dashboard-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    user,
    pathname,
    mounted,
    demoIndustryId,
    sidebarOpen,
    setSidebarOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    compactShell,
    sidebarSearch,
    setSidebarSearch,
    sidebarBranding,
    temaConfig,
    modulosBuscados,
    isPosShell,
    isKioskMode,
    handleLogout,
  } = useDashboardShell()

  if (isKioskMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <OnboardingTour enabled={false} />
        {children}
      </div>
    )
  }

  return (
    <div className="dashboard-canvas dashboard-shell flex min-h-svh relative overflow-x-hidden bg-background">
      <div className="theme-canvas-decor pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_6%,transparent),transparent)]" />

      <aside
        className={cn(
          "sidebar-container flex flex-col z-20 shrink-0 sticky top-0 min-h-0",
          "transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          "hidden lg:flex",
          sidebarOpen ? "w-[17.5rem]" : "w-[4.5rem]",
        )}
      >
        <div
          className={cn(
            "px-3 pt-3 pb-2",
            sidebarOpen ? "flex items-center gap-2" : "flex flex-col items-center gap-2",
          )}
        >
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          {!sidebarOpen && (
            <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} compact />
          )}
        </div>

        {sidebarOpen && (
          <SidebarSearch value={sidebarSearch} onChange={setSidebarSearch} className="pt-0" />
        )}

        <ScrollArea className="flex-1 min-h-0">
          <nav className="px-2 pb-3 space-y-0.5">
            {modulosBuscados.map((modulo) => (
              <SidebarCollapseSection
                key={modulo.label}
                modulo={modulo}
                sidebarOpen={sidebarOpen}
                defaultExpanded={
                  modulo.label === "Principal" ||
                  modulo.label === "Claver Nicho" ||
                  !!sidebarSearch
                }
              />
            ))}
            {sidebarSearch && modulosBuscados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                Sin resultados para &ldquo;{sidebarSearch}&rdquo;
              </p>
            )}
          </nav>
          <RecentlyViewed collapsed={!sidebarOpen} />
        </ScrollArea>

        {sidebarOpen && (
          <SidebarUserFooter
            nombre={user?.nombre}
            email={user?.email}
            onLogout={handleLogout}
          />
        )}
      </aside>

      <div className="app-main-frame flex-1 flex flex-col overflow-hidden relative z-10 w-full min-w-0">
        <ImpersonationBanner />
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main
          className={cn(
            "flex-1",
            isPosShell ? "overflow-hidden bg-background" : "overflow-auto bg-background/50",
          )}
        >
          <div className={cn(isPosShell ? "h-full p-0" : "p-3 sm:p-6 dashboard-main-pb")}>
            {!isPosShell && (
              <div className="mx-auto w-full max-w-[1400px] space-y-2 mb-4">
                <TrialBanner />
                <CajasAbiertasAlert />
                <DraftAlert />
              </div>
            )}
            {!isPosShell && <Breadcrumbs className="mb-4 max-lg:mb-3" />}
            <div
              className={cn(
                "mx-auto w-full",
                !isPosShell && "max-w-[1400px]",
                isPosShell && "h-full",
              )}
            >
              <MotionPresence mode="wait">
                <MotionPage pageKey={pathname} className={isPosShell ? "h-full min-h-0" : undefined}>
                  {children}
                </MotionPage>
              </MotionPresence>
            </div>
          </div>
        </main>
        {!isPosShell && <MobileBottomNav />}
      </div>

      <OnboardingTour enabled={!!demoIndustryId && mounted} />

      {compactShell && mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-50 h-svh w-full max-w-[min(20rem,88vw)] sidebar-container border-r-0 shadow-2xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <div className="flex-1 min-w-0">
                  <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <SidebarSearch value={sidebarSearch} onChange={setSidebarSearch} className="pt-0" />

              <ScrollArea className="flex-1 min-h-0">
                <nav className="px-2 pb-3 space-y-0.5">
                  {modulosBuscados.map((modulo) => (
                    <SidebarCollapseSection
                      key={modulo.label}
                      modulo={modulo}
                      sidebarOpen
                      defaultExpanded={
                        modulo.label === "Principal" ||
                        modulo.label === "Claver Nicho" ||
                        !!sidebarSearch
                      }
                      onNavigate={() => setMobileSidebarOpen(false)}
                    />
                  ))}
                  {sidebarSearch && modulosBuscados.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 px-2">
                      Sin resultados para &ldquo;{sidebarSearch}&rdquo;
                    </p>
                  )}
                </nav>
                <RecentlyViewed collapsed={false} />
              </ScrollArea>

              <SidebarUserFooter
                nombre={user?.nombre}
                email={user?.email}
                onLogout={handleLogout}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}