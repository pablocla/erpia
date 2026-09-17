"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Topbar } from "@/components/topbar"
import { ImpersonationBanner } from "@/components/ops/impersonation-banner"
import { PreviewExperienceBanner } from "@/components/ops/preview-experience-banner"
import { OfflineBanner } from "@/components/ui/offline-banner"

import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MotionPage, MotionPresence, MotionPresenceLite } from "@/components/ui/motion"
import { isOperationalDashboardRoute } from "@/lib/motion-config"
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { RecentlyViewed } from "@/components/recently-viewed"
import { SidebarBrand, SidebarSearch, SidebarUserFooter } from "@/components/dashboard/sidebar-ui"
import { SidebarCollapseSection } from "@/components/dashboard/sidebar-nav"
import { DashboardAlertsHub } from "@/components/dashboard/dashboard-alerts-hub"
import { SidebarEssentialsRow } from "@/components/dashboard/sidebar-essentials-row"
import { SidebarLiteNav } from "@/components/dashboard/sidebar-lite-nav"
import { SidebarUserCompact } from "@/components/dashboard/sidebar-user-compact"
import { OnboardingTour } from "@/components/onboarding-tour"
import { ProductTour } from "@/components/onboarding/product-tour"
import { useDashboardShell } from "@/hooks/use-dashboard-shell"
import { getActiveProductShell } from "@/lib/comercial/product-shell"
import { isPathInAnclaFiadoAllowlist } from "@/lib/comercial/lite-sidebar"
import { AppChecklistWidget } from "@/components/marketing/app-checklist-widget"
import { TrialBanner } from "@/components/trial-banner"
import { LiteBreadcrumb } from "@/components/dashboard/lite-breadcrumb"
import { getSubSaasExperience } from "@/lib/comercial/app-experience"
import { EspecialistaLaunchBanner } from "@/components/servicios-especialista/especialista-launch-banner"
import { isProtheusDashboardPath, protheusAccessBlocked } from "@/lib/comercial/protheus-license"

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
    modoLite,
    productosSku,
  } = useDashboardShell()
  const router = useRouter()

  const activeShell = getActiveProductShell(modoLite, productosSku)
  const subSaasExperience = activeShell?.slug ? getSubSaasExperience(activeShell.slug) : null
  const isLiteShell = modoLite !== "completo" && Boolean(activeShell)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const effectiveSidebarOpen = isTablet ? false : sidebarOpen
  const operationalRoute = isOperationalDashboardRoute(pathname)
  const rol = user?.rol

  const [freshSignup, setFreshSignup] = useState(false)
  useEffect(() => {
    if (!mounted) return
    const fresh = localStorage.getItem("claver_fresh_signup") === "1"
    setFreshSignup(fresh)
    if (fresh) localStorage.removeItem("claver_fresh_signup")
  }, [mounted])

  // Trial enforcement: no hard-bloquear ancla gratis en rutas lite (fiado/cobranza)
  const { toast } = useToast()
  useEffect(() => {
    if (!mounted || !user) return
    if (pathname === "/dashboard/trial-vencido") return
    if (pathname.startsWith("/dashboard/protheus/licencia")) return

    const enAllowlist = isPathInAnclaFiadoAllowlist(pathname)

    fetch("/api/config/trial", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const tieneAncla = Boolean(data?.access?.tieneAnclaGratis)
        const trialExpirado = Boolean(data?.trial?.expirado)
        const bloqueoTotal = Boolean(data?.access?.bloqueoTotal)
        const modoLite = data?.access?.modoLite as string | null | undefined
        const licenseStatus = data?.protheus?.status as string | undefined

        // Protheus no usa el trial ni Mercado Pago del ERP. Solo licencia anual TOTVS.
        if (isProtheusDashboardPath(pathname)) {
          if (protheusAccessBlocked(licenseStatus)) {
            router.replace("/dashboard/protheus/licencia")
          }
          return
        }

        if (modoLite === "protheus") return

        // Ancla gratis: puede seguir en rutas lite aunque el trial de pago haya vencido
        if (tieneAncla && enAllowlist) return

        if (bloqueoTotal || (trialExpirado && !enAllowlist)) {
          router.replace("/dashboard/trial-vencido")
        }
      })
      .catch(console.error)
  }, [mounted, user, pathname, router])

  if (isKioskMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <OnboardingTour enabled={false} />
        {children}
      </div>
    )
  }

  return (
    <div className="dashboard-canvas dashboard-shell flex h-[100dvh] relative overflow-hidden bg-background">
      <div className="theme-canvas-decor pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_6%,transparent),transparent)]" />

      <aside
        className={cn(
          "sidebar-container flex flex-col z-20 shrink-0 h-full overflow-hidden",
          "transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          isPosShell ? "hidden" : "hidden md:flex",
          effectiveSidebarOpen ? "w-[17.5rem]" : "w-[4.5rem]",
        )}
      >
        <div
          className={cn(
            "px-3 pt-3 pb-2",
            effectiveSidebarOpen ? "flex items-center gap-2" : "flex flex-col items-center gap-2",
          )}
        >
          {effectiveSidebarOpen && (
            <div className="flex-1 min-w-0">
              <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} />
            </div>
          )}
          {!isTablet && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          {!effectiveSidebarOpen && (
            <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} compact />
          )}
        </div>

        {effectiveSidebarOpen && modoLite === "completo" && (
          <SidebarSearch value={sidebarSearch} onChange={setSidebarSearch} className="pt-0" />
        )}

        <ScrollArea className="flex-1 min-h-0">
          {modoLite === "completo" ? (
            <>
              <SidebarEssentialsRow rol={rol} sidebarOpen={effectiveSidebarOpen} />
              <nav className="px-2 pb-3 space-y-0.5">
                {modulosBuscados.map((modulo) => (
                  <SidebarCollapseSection
                    key={modulo.label}
                    modulo={modulo}
                    sidebarOpen={effectiveSidebarOpen}
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
            </>
          ) : activeShell ? (
            <SidebarLiteNav shell={activeShell} sidebarOpen={effectiveSidebarOpen} />
          ) : null}
          {modoLite === "completo" && <RecentlyViewed collapsed={!effectiveSidebarOpen} />}
        </ScrollArea>

        {effectiveSidebarOpen ? (
          <SidebarUserFooter
            nombre={user?.nombre}
            email={user?.email}
            onLogout={handleLogout}
          />
        ) : (
          <SidebarUserCompact onLogout={handleLogout} />
        )}
      </aside>

      <div className="app-main-frame flex-1 flex flex-col overflow-hidden relative z-10 w-full min-w-0">
        <OfflineBanner />
        <PreviewExperienceBanner />
        <ImpersonationBanner />
        <Topbar
          onMenuClick={isMobile ? () => setMobileSidebarOpen(true) : undefined}
          modoLite={modoLite}
          productosSku={productosSku}
        />
        <main
          className={cn(
            "flex-1",
            isPosShell ? "overflow-hidden bg-background" : "overflow-auto bg-background/50",
          )}
        >
          <div className="p-3 sm:p-6 dashboard-main-pb">
            {!isPosShell && !pathname.startsWith("/dashboard/fumigacion") && (
              <div className="mx-auto w-full max-w-[1400px] mb-3 space-y-3">
                <TrialBanner />
                <EspecialistaLaunchBanner forceOpen={freshSignup} />
                <DashboardAlertsHub />
              </div>
            )}
            {!isPosShell && modoLite === "completo" && <Breadcrumbs className="mb-4 max-lg:mb-3" />}
            {!isPosShell && isLiteShell && !pathname.startsWith("/dashboard/fumigacion") && (
              <LiteBreadcrumb
                modoLite={modoLite}
                productosSku={productosSku}
                className="mb-3 lg:hidden"
              />
            )}
            <div
              className={cn(
                "mx-auto w-full",
                !isPosShell && "max-w-[1400px]",
                isPosShell && "h-full",
              )}
            >
              {operationalRoute ? (
                <MotionPresenceLite>
                  <MotionPage
                    pageKey={pathname}
                    transitionMode="lite"
                    className={isPosShell ? "h-full min-h-0" : undefined}
                  >
                    {children}
                  </MotionPage>
                </MotionPresenceLite>
              ) : (
                <MotionPresence mode="wait">
                  <MotionPage pageKey={pathname} className={isPosShell ? "h-full min-h-0" : undefined}>
                    {children}
                  </MotionPage>
                </MotionPresence>
              )}
            </div>
          </div>
        </main>
        {!isPosShell && <MobileBottomNav />}
      </div>

      {!isPosShell && (
        <>
          <OnboardingTour
            enabled={mounted && !!demoIndustryId}
            industryId={demoIndustryId}
            variant="demo"
          />
          <OnboardingTour enabled={mounted && !demoIndustryId && freshSignup} variant="web" />
          <ProductTour />
        </>
      )}

      {subSaasExperience && modoLite !== "completo" && !isPosShell && (
        <AppChecklistWidget appId={activeShell!.slug} guide={subSaasExperience} />
      )}

      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-50 h-svh w-full max-w-[min(20rem,88vw)] sidebar-container border-r-0 shadow-2xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <div className="flex-1 min-w-0">
                  <SidebarBrand branding={sidebarBranding} logoUrl={temaConfig.logoUrl} />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isLiteShell ? activeShell!.marca : "Todos los módulos"}
                  </p>
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

              {modoLite === "completo" && (
                <SidebarSearch value={sidebarSearch} onChange={setSidebarSearch} className="pt-0" />
              )}

              <ScrollArea className="flex-1 min-h-0">
                {modoLite === "completo" ? (
                  <>
                    <SidebarEssentialsRow
                      rol={rol}
                      sidebarOpen
                      onNavigate={() => setMobileSidebarOpen(false)}
                    />
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
                  </>
                ) : activeShell ? (
                  <SidebarLiteNav
                    shell={activeShell}
                    sidebarOpen
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                ) : null}
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