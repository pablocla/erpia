"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { isImpersonatingSession, performLogoutAndRedirect } from "@/lib/auth/session-client"
import { hasPreviewHome } from "@/lib/auth/preview-session-client"
import { shouldRedirectAnalystToCloud } from "@/lib/auth/home-redirect"
import { getAuthHeaders, getToken, useAuthStore } from "@/lib/stores/auth-store"
import { getCountryFeatures, type CountryFeatures } from "@/lib/country/country-features"
import { normalizeRubroValue, type Rubro } from "@/lib/onboarding/onboarding-ia"
import { isMenuItemAllowedInModoLite } from "@/lib/comercial/lite-sidebar"
import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { useUIStore } from "@/lib/stores/ui-store"
import { useThemeConfig } from "@/lib/theme-config"
import { useCompactShell } from "@/hooks/use-mobile"
import { resolveDashboardBranding } from "@/lib/brand"
import { getActiveProductShell } from "@/lib/comercial/product-shell"
import {
  getIndustryTemplate,
  getMenuLabelForRubro,
  getSectionLabelForRubro,
} from "@/lib/comercial/industry-templates"
import {
  getSidebarAllowlist,
  isMenuHrefVisibleInAllowlist,
  isModuloSectionVisible,
} from "@/lib/comercial/sidebar-rubro-filter"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { DASHBOARD_SIDEBAR_MODULOS } from "@/lib/dashboard/sidebar-modules"
import { canRenderMenuItem, ordenarModulosPorRubro } from "@/lib/dashboard/sidebar-filters"
import {
  goLiveBadgeForHref,
  shouldHideHrefForGoLive,
} from "@/lib/comercial/go-live-nav-badges"

export function useDashboardShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const compactShell = useCompactShell()
  const [mounted, setMounted] = useState(false)
  
  // Inicializar desde localStorage para evitar FOUC
  const [modulosActivos, setModulosActivos] = useState<Record<string, boolean> | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("claver_modulos_activos")
        if (cached) return JSON.parse(cached)
      } catch (e) {
        /* ignore */
      }
    }
    return null
  })
  
  const [featuresActivas, setFeaturesActivas] = useState<Record<string, boolean> | null>(null)
  
  // Inicializar desde localStorage para evitar FOUC
  const [productosSku, setProductosSku] = useState<Record<string, boolean> | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("claver_productos_sku")
        if (cached) return JSON.parse(cached)
      } catch (e) {
        /* ignore */
      }
    }
    return null
  })
  
  const [rubro, setRubro] = useState<Rubro>("otro")
  const [demoIndustryId, setDemoIndustryId] = useState<string | null>(null)
  const [modoLite, setModoLite] = useState<string>("completo")
  const [condicionIva, setCondicionIva] = useState<string>("Responsable Inscripto")
  const [sidebarSearch, setSidebarSearch] = useState("")
  const [countryFeatures, setCountryFeatures] = useState<CountryFeatures>(getCountryFeatures("AR"))
  const [isClaverAnalyst, setIsClaverAnalyst] = useState(false)

  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const role = user?.rol
  const userId = user?.id ?? null
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { config: temaConfig } = useThemeConfig()

  const isPosShell = pathname.startsWith("/dashboard/pos")
  const kioskParam = searchParams.get("mode")
  const isKioskMode = isPosShell && (kioskParam === "kiosk" || kioskParam === "kiosko")
  const presentMode = searchParams.get("present") === "1" && !!demoIndustryId
  const empresaDisplayName = temaConfig.appName ?? "ERP Argentina"

  const industryTemplate = useMemo(
    () => (demoIndustryId ? getIndustryTemplate(demoIndustryId) : null),
    [demoIndustryId],
  )

  const sidebarBranding = useMemo(() => {
    const effectiveRubro = industryTemplate?.rubro ?? rubro
    const base = resolveDashboardBranding(empresaDisplayName, effectiveRubro)
    
    // Override con la marca del producto si es un sub-saas (modoLite !== completo)
    const shell = getActiveProductShell(modoLite, productosSku)
    if (shell && shell.marca) {
      base.title = shell.marca
    }

    if (!industryTemplate) return base
    return {
      ...base,
      title: shell?.marca ?? industryTemplate.label,
      subtitle: `Demo · ${industryTemplate.tagline}`,
      liveLabel: industryTemplate.wowMoment,
    }
  }, [empresaDisplayName, rubro, industryTemplate, modoLite, productosSku])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !isHydrated) return
    const stored = getToken()
    if (!stored) {
      router.replace("/login")
      return
    }
    fetch("/api/claver/analista/status", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsClaverAnalyst(Boolean(data?.isAnalyst)))
      .catch(() => setIsClaverAnalyst(false))
  }, [mounted, isHydrated, token, router])

  useEffect(() => {
    if (!mounted || !isClaverAnalyst) return
    if (isImpersonatingSession() || hasPreviewHome()) return
    // Solo redirigir al analista si está en la raíz /dashboard, no en sub-rutas como /dashboard/cerebro
    if (pathname !== "/dashboard") return
    if (
      !shouldRedirectAnalystToCloud({
        email: user?.email,
        rol: role,
        isAnalyst: isClaverAnalyst,
      })
    ) {
      return
    }
    router.replace("/claver-cloud")
  }, [mounted, isClaverAnalyst, user?.email, role, router, pathname])

  useEffect(() => {
    if (!compactShell) setMobileSidebarOpen(false)
  }, [compactShell])

  useEffect(() => {
    if (!mobileSidebarOpen || !compactShell) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileSidebarOpen, compactShell])

  const addRecentPage = useUIStore((s) => s.addRecentPage)
  useEffect(() => {
    if (pathname && pathname !== "/dashboard") {
      const segments = pathname.split("/").filter(Boolean)
      const last = segments[segments.length - 1]
      const label = last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ") : ""
      if (label) addRecentPage(pathname, label)
    }
  }, [pathname, addRecentPage])

  const handleLogout = useCallback(() => {
    performLogoutAndRedirect("/login")
  }, [])

  const authHeaders = useCallback(() => getAuthHeaders(), [])

  const cargarModulos = useCallback(async () => {
    try {
      const res = await fetch("/api/config/modulos", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setModulosActivos(data)
        if (typeof window !== "undefined") {
          localStorage.setItem("claver_modulos_activos", JSON.stringify(data))
        }
      }
    } catch {
      /* use all modules */
    }
  }, [authHeaders])

  const cargarRubro = useCallback(async () => {
    try {
      const res = await fetch("/api/config/empresa", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setRubro(normalizeRubroValue(data?.rubro))
      setDemoIndustryId(typeof data?.demoIndustryId === "string" ? data.demoIndustryId : null)
      setModoLite(data?.modoLite ?? "completo")
      setCondicionIva(data?.condicionIva ?? "Responsable Inscripto")
    } catch {
      setRubro("otro")
      setDemoIndustryId(null)
      setModoLite("completo")
    }
  }, [authHeaders])

  const cargarCountryContext = useCallback(async () => {
    try {
      const res = await fetch("/api/config/country-context", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      if (data?.features) setCountryFeatures(data.features)
    } catch {
      /* fallback AR */
    }
  }, [authHeaders])

  const cargarProductosSku = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/productos", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      if (data.mapa && typeof data.mapa === "object") {
        setProductosSku(data.mapa as Record<string, boolean>)
        if (typeof window !== "undefined") {
          localStorage.setItem("claver_productos_sku", JSON.stringify(data.mapa))
        }
      }
    } catch {
      setProductosSku(null)
    }
  }, [authHeaders])

  const cargarFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/config/features", { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      const mapa: Record<string, boolean> = {}
      if (Array.isArray(data)) {
        for (const feature of data) {
          if (typeof feature.featureKey === "string") {
            mapa[feature.featureKey] = feature.activado
          }
        }
      }
      setFeaturesActivas(mapa)
    } catch {
      setFeaturesActivas(null)
    }
  }, [authHeaders])

  useEffect(() => {
    // No spamear el backend con 401/403 si aún no hay sesión (caso demo mal logueada)
    if (!mounted || !isHydrated) return
    if (!getToken()) return

    cargarModulos()
    cargarRubro()
    cargarCountryContext()
    cargarFeatures()
    cargarProductosSku()
    const handler = () => {
      cargarModulos()
      cargarCountryContext()
      cargarFeatures()
      cargarProductosSku()
    }
    window.addEventListener("modulos-updated", handler)
    window.addEventListener("productos-updated", handler)
    return () => {
      window.removeEventListener("modulos-updated", handler)
      window.removeEventListener("productos-updated", handler)
    }
  }, [
    mounted,
    isHydrated,
    token,
    cargarModulos,
    cargarRubro,
    cargarCountryContext,
    cargarFeatures,
    cargarProductosSku,
  ])

  const previewingActor = isImpersonatingSession()
  const analystForNav = isClaverAnalyst && !previewingActor
  const isAdmin = ["administrador", "admin", "dueno"].includes(role || "")
  const effectiveRubro = industryTemplate?.rubro ?? rubro

  const sidebarAllowlist = useMemo(
    () =>
      getSidebarAllowlist({
        rubro: effectiveRubro,
        industryId: demoIndustryId,
        modoLite,
        presentMode,
        isAdmin,
      }),
    [effectiveRubro, demoIndustryId, modoLite, presentMode, isAdmin],
  )

  const modulosFiltrados = useMemo(
    () =>
      DASHBOARD_SIDEBAR_MODULOS.map((modulo) => ({
        ...modulo,
        items: modulo.items.filter((item) => {
          if (
            !canRenderMenuItem(
              item,
              role,
              modulosActivos,
              featuresActivas,
              productosSku,
              userId,
              effectiveRubro,
              analystForNav,
              countryFeatures,
              condicionIva,
            )
          ) {
            return false
          }
          if (modoLite !== "completo" && (!item.href || !isMenuItemAllowedInModoLite(item.href, modoLite as ModoLite))) {
            return false
          }
          if (!item.href || !isMenuHrefVisibleInAllowlist(item.href, sidebarAllowlist)) {
            return false
          }
          // Ocultar verticales no vendibles en menú comercial
          if (shouldHideHrefForGoLive(item.href, { showNoVender: analystForNav })) {
            return false
          }
          return true
        }),
      })).filter((modulo) => {
        // Nunca secciones vacías
        if (modulo.items.length === 0 && modulo.label !== "Claver Nicho") return false
        if (!isModuloSectionVisible(modulo.label, modulo.moduloKey, effectiveRubro, sidebarAllowlist)) {
          return false
        }
        if (!modulo.moduloKey) return modulo.items.length > 0
        // Dueño ya no ve módulos apagados ni secciones sin ítems
        if (modulosActivos && modulosActivos[modulo.moduloKey] === false) return false
        return modulo.items.length > 0
      }),
    [
      role,
      modulosActivos,
      featuresActivas,
      productosSku,
      userId,
      analystForNav,
      countryFeatures,
      modoLite,
      sidebarAllowlist,
      effectiveRubro,
      condicionIva,
    ],
  )

  const modulosOrdenados = useMemo(
    () => ordenarModulosPorRubro(modulosFiltrados, effectiveRubro),
    [modulosFiltrados, effectiveRubro],
  )

  const modulosConLabels = useMemo(() => {
    const nicheAppItems = (productosSku
      ? NICHE_APPS.filter((app) => productosSku[app.sku] === true)
      : []
    )
      .map((app) => ({
        href: app.redirectPath ?? app.goldenPath,
        icon: Sparkles,
        label: app.nombre.replace(/^Claver /, ""),
        skuKey: app.sku,
      }))
      .filter((item) => isMenuHrefVisibleInAllowlist(item.href, sidebarAllowlist))

    return modulosOrdenados
      .map((modulo) => {
        const rawItems = modulo?.items || []
        const items = modulo?.label === "Claver Nicho" ? [...rawItems, ...nicheAppItems] : rawItems

        return {
          ...modulo,
          label: getSectionLabelForRubro(modulo.moduloKey, modulo.label, effectiveRubro, demoIndustryId),
          items: items.map((item) => {
            const goLive = goLiveBadgeForHref(item.href)
            return {
              ...item,
              label: item.href
                ? getMenuLabelForRubro(item.href, item.label, effectiveRubro, demoIndustryId)
                : item.label,
              // badge explícito del ítem gana; si no, profundidad go-live
              badge: (item as any).badge ?? goLive?.label,
              goLiveTier: goLive?.tier,
            }
          }),
        }
      })
      .filter((modulo) => (modulo?.items || []).length > 0)
  }, [modulosOrdenados, effectiveRubro, demoIndustryId, productosSku, sidebarAllowlist])

  const modulosBuscados = useMemo(() => {
    if (!sidebarSearch.trim()) return modulosConLabels
    const q = sidebarSearch.toLowerCase()
    return modulosConLabels
      .map((modulo) => ({
        ...modulo,
        items: (modulo?.items || []).filter((item) => item?.label?.toLowerCase()?.includes(q)),
      }))
      .filter((modulo) => (modulo?.items || []).length > 0)
  }, [modulosConLabels, sidebarSearch])

  return {
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
  }
}