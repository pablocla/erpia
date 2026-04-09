"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

export type Palette =
  | "neutral"
  | "porcelain"
  | "sand"
  | "sage"
  | "mist"
  | "blue"
  | "green"
  | "orange"
  | "rose"
  | "violet"
  | "amber"
  | "teal"
export type Density = "compact" | "default" | "comfortable"
export type SidebarStyle = "default" | "floating" | "inset"
export type RadiusPreset = "none" | "sm" | "md" | "lg" | "xl"
export type Surface = "soft" | "clean" | "glow"

const RADIUS_MAP: Record<RadiusPreset, string> = {
  none: "0rem",
  sm: "0.3rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "1rem",
}

export const PALETTE_COLORS: Record<Palette, { label: string; swatch: string }> = {
  neutral: { label: "Neutral", swatch: "#737373" },
  porcelain: { label: "Porcelana", swatch: "#c9b6a4" },
  sand: { label: "Arena", swatch: "#d7a46a" },
  sage: { label: "Salvia", swatch: "#7aa28d" },
  mist: { label: "Niebla", swatch: "#7b93b5" },
  blue: { label: "Azul", swatch: "#3b82f6" },
  green: { label: "Verde", swatch: "#22c55e" },
  orange: { label: "Naranja", swatch: "#f97316" },
  rose: { label: "Rosa", swatch: "#f43f5e" },
  violet: { label: "Violeta", swatch: "#8b5cf6" },
  amber: { label: "Ámbar", swatch: "#f59e0b" },
  teal: { label: "Teal", swatch: "#14b8a6" },
}

export interface ThemeConfig {
  palette: Palette
  density: Density
  sidebarStyle: SidebarStyle
  radius: RadiusPreset
  surface: Surface
}

const DEFAULT_CONFIG: ThemeConfig = {
  palette: "porcelain",
  density: "default",
  sidebarStyle: "default",
  radius: "lg",
  surface: "soft",
}

const STORAGE_KEY = "erp-theme-config"

interface ThemeConfigContextValue {
  config: ThemeConfig
  setPalette: (p: Palette) => void
  setDensity: (d: Density) => void
  setSidebarStyle: (s: SidebarStyle) => void
  setRadius: (r: RadiusPreset) => void
  setSurface: (s: Surface) => void
  applyConfig: (c: ThemeConfig) => void
  resetConfig: () => void
}

const ThemeConfigContext = createContext<ThemeConfigContextValue | null>(null)

function loadConfig(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return DEFAULT_CONFIG
  }
}

function applyToDocument(config: ThemeConfig) {
  const root = document.documentElement
  // Palette
  if (config.palette === "neutral") {
    root.removeAttribute("data-palette")
  } else {
    root.setAttribute("data-palette", config.palette)
  }
  // Density
  if (config.density === "default") {
    root.removeAttribute("data-density")
  } else {
    root.setAttribute("data-density", config.density)
  }
  // Sidebar style
  if (config.sidebarStyle === "default") {
    root.removeAttribute("data-sidebar-style")
  } else {
    root.setAttribute("data-sidebar-style", config.sidebarStyle)
  }
  // Surface
  if (config.surface === "soft") {
    root.removeAttribute("data-surface")
  } else {
    root.setAttribute("data-surface", config.surface)
  }
  // Radius
  root.style.setProperty("--radius", RADIUS_MAP[config.radius])
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loaded = loadConfig()
    setConfig(loaded)
    applyToDocument(loaded)
    setMounted(true)
  }, [])

  const persist = useCallback((next: ThemeConfig) => {
    setConfig(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    applyToDocument(next)
  }, [])

  const setPalette = useCallback((palette: Palette) => {
    persist({ ...config, palette })
  }, [config, persist])

  const setDensity = useCallback((density: Density) => {
    persist({ ...config, density })
  }, [config, persist])

  const setSidebarStyle = useCallback((sidebarStyle: SidebarStyle) => {
    persist({ ...config, sidebarStyle })
  }, [config, persist])

  const setRadius = useCallback((radius: RadiusPreset) => {
    persist({ ...config, radius })
  }, [config, persist])

  const setSurface = useCallback((surface: Surface) => {
    persist({ ...config, surface })
  }, [config, persist])

  const applyConfig = useCallback((next: ThemeConfig) => {
    persist({ ...DEFAULT_CONFIG, ...next })
  }, [persist])

  const resetConfig = useCallback(() => {
    persist(DEFAULT_CONFIG)
  }, [persist])

  if (!mounted) return null

  return (
    <ThemeConfigContext.Provider
      value={{
        config,
        setPalette,
        setDensity,
        setSidebarStyle,
        setRadius,
        setSurface,
        applyConfig,
        resetConfig,
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
