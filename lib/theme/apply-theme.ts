import type { EmpresaTemaConfig, RadiusPreset } from "./types"

const RADIUS_MAP: Record<RadiusPreset, string> = {
  none: "0rem",
  sm: "0.3rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "1rem",
}

const FONT_FAMILY_MAP = {
  manrope: "var(--font-manrope), system-ui, sans-serif",
  inter: "var(--font-inter), Inter, system-ui, sans-serif",
  system: "system-ui, -apple-system, Segoe UI, sans-serif",
} as const

const CHART_PALETTES = {
  default: null,
  vibrant: ["oklch(0.62 0.22 25)", "oklch(0.65 0.18 145)", "oklch(0.68 0.2 250)", "oklch(0.7 0.18 310)", "oklch(0.75 0.2 85)"],
  pastel: ["oklch(0.78 0.08 25)", "oklch(0.8 0.07 145)", "oklch(0.82 0.06 250)", "oklch(0.84 0.07 310)", "oklch(0.86 0.08 85)"],
  mono: ["oklch(0.45 0.02 260)", "oklch(0.55 0.02 260)", "oklch(0.65 0.02 260)", "oklch(0.75 0.02 260)", "oklch(0.85 0.02 260)"],
} as const

function setOrRemove(root: HTMLElement, attr: string, value: string | null | undefined, defaultValue?: string) {
  if (!value || value === defaultValue) {
    root.removeAttribute(attr)
  } else {
    root.setAttribute(attr, value)
  }
}

export function applyThemeToDocument(config: EmpresaTemaConfig) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  setOrRemove(root, "data-palette", config.palette, "neutral")
  setOrRemove(root, "data-density", config.density, "default")
  setOrRemove(root, "data-sidebar-style", config.sidebarStyle, "default")
  setOrRemove(root, "data-sidebar-position", config.sidebarPosition, "left")
  setOrRemove(root, "data-surface", config.surface, "soft")
  setOrRemove(root, "data-blur", config.blurIntensity, "medium")
  setOrRemove(root, "data-canvas", config.canvasStyle, "gradient")
  setOrRemove(root, "data-font", config.fontFamily, "manrope")
  setOrRemove(root, "data-display-font", config.displayFont, "fraunces")
  setOrRemove(root, "data-font-scale", config.fontScale, "md")
  setOrRemove(root, "data-topbar", config.topbarStyle, "default")
  setOrRemove(root, "data-table-style", config.tableStyle, "minimal")
  setOrRemove(root, "data-card-style", config.cardStyle, "elevated")
  setOrRemove(root, "data-icon-style", config.iconStyle, "outline")
  setOrRemove(root, "data-icon-size", config.iconSize, "md")
  setOrRemove(root, "data-sidebar-color", config.sidebarColor, "primary")
  setOrRemove(root, "data-chart-palette", config.chartPalette, "default")
  setOrRemove(root, "data-locale", config.locale, "es-AR")

  root.style.setProperty("--radius", RADIUS_MAP[config.radius])
  root.style.fontFamily = FONT_FAMILY_MAP[config.fontFamily]

  if (config.highContrast) root.setAttribute("data-high-contrast", "true")
  else root.removeAttribute("data-high-contrast")

  if (config.reducedMotion || !config.animationsEnabled) root.setAttribute("data-reduced-motion", "true")
  else root.removeAttribute("data-reduced-motion")

  if (config.touchMode) root.setAttribute("data-touch-mode", "true")
  else root.removeAttribute("data-touch-mode")

  if (config.brandColor && /^#[0-9A-Fa-f]{6}$/.test(config.brandColor)) {
    root.style.setProperty("--brand-primary", config.brandColor)
    root.setAttribute("data-brand-color", "true")
  } else {
    root.style.removeProperty("--brand-primary")
    root.removeAttribute("data-brand-color")
  }

  const charts = CHART_PALETTES[config.chartPalette]
  if (charts) {
    charts.forEach((color, i) => root.style.setProperty(`--chart-${i + 1}`, color))
  } else {
    for (let i = 1; i <= 5; i++) root.style.removeProperty(`--chart-${i}`)
  }

  root.lang = config.locale
}