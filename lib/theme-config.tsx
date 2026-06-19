"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react"
import { useTheme } from "next-themes"
import { authFetch } from "@/lib/stores"
import { applyThemeToDocument } from "@/lib/theme/apply-theme"
import {
  DEFAULT_TEMA_CONFIG,
  mergeTemaConfig,
  type EmpresaTemaConfig,
  type Palette,
  type Density,
  type SidebarStyle,
  type SidebarPosition,
  type RadiusPreset,
  type Surface,
  type ThemeMode,
  type FontFamily,
  type DisplayFont,
  type FontScale,
  type BlurIntensity,
  type CanvasStyle,
  type TopbarStyle,
  type TableStyle,
  type CardStyle,
  type IconStyle,
  type IconSize,
  type SidebarColor,
  type ChartPalette,
  type ThemeLocale,
} from "@/lib/theme/types"

export type { EmpresaTemaConfig as ThemeConfig, Palette, Density, SidebarStyle, RadiusPreset, Surface }
export { PALETTE_COLORS, THEME_PRESETS, DEFAULT_TEMA_CONFIG } from "@/lib/theme/types"

interface ThemeConfigContextValue {
  config: EmpresaTemaConfig
  canEdit: boolean
  loading: boolean
  saving: boolean
  setMode: (m: ThemeMode) => void
  setPalette: (p: Palette) => void
  setDensity: (d: Density) => void
  setSidebarStyle: (s: SidebarStyle) => void
  setSidebarPosition: (s: SidebarPosition) => void
  setRadius: (r: RadiusPreset) => void
  setSurface: (s: Surface) => void
  setBlurIntensity: (b: BlurIntensity) => void
  setCanvasStyle: (c: CanvasStyle) => void
  setFontFamily: (f: FontFamily) => void
  setDisplayFont: (f: DisplayFont) => void
  setFontScale: (f: FontScale) => void
  setHighContrast: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
  setAnimationsEnabled: (v: boolean) => void
  setTopbarStyle: (s: TopbarStyle) => void
  setTableStyle: (s: TableStyle) => void
  setCardStyle: (s: CardStyle) => void
  setIconStyle: (s: IconStyle) => void
  setIconSize: (s: IconSize) => void
  setSidebarColor: (s: SidebarColor) => void
  setChartPalette: (c: ChartPalette) => void
  setBrandColor: (c: string | null) => void
  setAppName: (n: string | null) => void
  setLogoUrl: (u: string | null) => void
  setLocale: (l: ThemeLocale) => void
  setTouchMode: (v: boolean) => void
  applyConfig: (c: Partial<EmpresaTemaConfig>) => void
  resetConfig: () => void
  saveNow: () => Promise<void>
}

const ThemeConfigContext = createContext<ThemeConfigContextValue | null>(null)

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [config, setConfig] = useState<EmpresaTemaConfig>(DEFAULT_TEMA_CONFIG)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const configRef = useRef(config)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSave = useRef(false)

  configRef.current = config

  const applyLocal = useCallback(
    (next: EmpresaTemaConfig) => {
      setConfig(next)
      applyThemeToDocument(next)
      try {
        localStorage.removeItem("theme")
      } catch {
        /* ignore */
      }
      setTheme(next.mode)
    },
    [setTheme]
  )

  const persistToServer = useCallback(async (next: EmpresaTemaConfig) => {
    if (!canEdit) return
    setSaving(true)
    try {
      const { version: _v, ...payload } = next
      const res = await authFetch("/api/config/tema", {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.config) applyLocal(mergeTemaConfig(data.config))
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }, [applyLocal, canEdit])

  const scheduleSave = useCallback(
    (next: EmpresaTemaConfig) => {
      if (!canEdit || skipSave.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persistToServer(next), 600)
    },
    [canEdit, persistToServer]
  )

  const update = useCallback(
    (partial: Partial<EmpresaTemaConfig>) => {
      if (!canEdit) return
      const next = mergeTemaConfig({ ...configRef.current, ...partial })
      applyLocal(next)
      scheduleSave(next)
    },
    [applyLocal, canEdit, scheduleSave]
  )

  useEffect(() => {
    applyThemeToDocument(DEFAULT_TEMA_CONFIG)

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      setLoading(false)
      return
    }

    authFetch("/api/config/tema")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        skipSave.current = true
        applyLocal(mergeTemaConfig(data.config))
        setCanEdit(Boolean(data.canEdit))
        skipSave.current = false
      })
      .finally(() => setLoading(false))
  }, [applyLocal])

  const makeSetter = <K extends keyof EmpresaTemaConfig>(key: K) =>
    (value: EmpresaTemaConfig[K]) => update({ [key]: value } as Partial<EmpresaTemaConfig>)

  const applyConfig = useCallback(
    (partial: Partial<EmpresaTemaConfig>) => update(partial),
    [update]
  )

  const resetConfig = useCallback(async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      const res = await authFetch("/api/config/tema", { method: "DELETE" })
      if (res.ok) {
        const data = await res.json()
        skipSave.current = true
        applyLocal(mergeTemaConfig(data.config))
        skipSave.current = false
      }
    } finally {
      setSaving(false)
    }
  }, [applyLocal, canEdit])

  const saveNow = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await persistToServer(configRef.current)
  }, [persistToServer])

  return (
    <ThemeConfigContext.Provider
      value={{
        config,
        canEdit,
        loading,
        saving,
        setMode: makeSetter("mode"),
        setPalette: makeSetter("palette"),
        setDensity: makeSetter("density"),
        setSidebarStyle: makeSetter("sidebarStyle"),
        setSidebarPosition: makeSetter("sidebarPosition"),
        setRadius: makeSetter("radius"),
        setSurface: makeSetter("surface"),
        setBlurIntensity: makeSetter("blurIntensity"),
        setCanvasStyle: makeSetter("canvasStyle"),
        setFontFamily: makeSetter("fontFamily"),
        setDisplayFont: makeSetter("displayFont"),
        setFontScale: makeSetter("fontScale"),
        setHighContrast: makeSetter("highContrast"),
        setReducedMotion: makeSetter("reducedMotion"),
        setAnimationsEnabled: makeSetter("animationsEnabled"),
        setTopbarStyle: makeSetter("topbarStyle"),
        setTableStyle: makeSetter("tableStyle"),
        setCardStyle: makeSetter("cardStyle"),
        setIconStyle: makeSetter("iconStyle"),
        setIconSize: makeSetter("iconSize"),
        setSidebarColor: makeSetter("sidebarColor"),
        setChartPalette: makeSetter("chartPalette"),
        setBrandColor: makeSetter("brandColor"),
        setAppName: makeSetter("appName"),
        setLogoUrl: makeSetter("logoUrl"),
        setLocale: makeSetter("locale"),
        setTouchMode: makeSetter("touchMode"),
        applyConfig,
        resetConfig,
        saveNow,
      }}
    >
      {children}
    </ThemeConfigContext.Provider>
  )
}

export function useThemeConfig() {
  const ctx = useContext(ThemeConfigContext)
  if (!ctx) throw new Error("useThemeConfig must be used within ThemeConfigProvider")
  return ctx
}