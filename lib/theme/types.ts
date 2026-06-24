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
export type SidebarPosition = "left" | "right"
export type RadiusPreset = "none" | "sm" | "md" | "lg" | "xl"
export type Surface = "soft" | "clean" | "glow"
export type ThemeMode = "light" | "dark" | "system"
export type FontFamily = "manrope" | "inter" | "system"
export type DisplayFont = "fraunces" | "none"
export type FontScale = "sm" | "md" | "lg"
export type BlurIntensity = "low" | "medium" | "high"
export type CanvasStyle = "gradient" | "solid" | "minimal"
export type TopbarStyle = "default" | "compact"
export type TableStyle = "minimal" | "zebra" | "bordered"
export type CardStyle = "flat" | "elevated" | "outlined"
export type IconStyle = "outline" | "filled"
export type IconSize = "sm" | "md" | "lg"
export type SidebarColor = "primary" | "neutral" | "dark"
export type ChartPalette = "default" | "vibrant" | "pastel" | "mono"
export type ThemeLocale = "es-AR" | "es-MX" | "pt-BR" | "en-US"

export interface EmpresaTemaConfig {
  version: 1
  mode: ThemeMode
  palette: Palette
  density: Density
  sidebarStyle: SidebarStyle
  sidebarPosition: SidebarPosition
  radius: RadiusPreset
  surface: Surface
  blurIntensity: BlurIntensity
  canvasStyle: CanvasStyle
  fontFamily: FontFamily
  displayFont: DisplayFont
  fontScale: FontScale
  highContrast: boolean
  reducedMotion: boolean
  animationsEnabled: boolean
  topbarStyle: TopbarStyle
  tableStyle: TableStyle
  cardStyle: CardStyle
  iconStyle: IconStyle
  iconSize: IconSize
  sidebarColor: SidebarColor
  chartPalette: ChartPalette
  brandColor: string | null
  appName: string | null
  logoUrl: string | null
  locale: ThemeLocale
  touchMode: boolean
}

/** @deprecated Use EmpresaTemaConfig */
export type ThemeConfig = EmpresaTemaConfig

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

export const DEFAULT_TEMA_CONFIG: EmpresaTemaConfig = {
  version: 1,
  mode: "system",
  palette: "porcelain",
  density: "default",
  sidebarStyle: "default",
  sidebarPosition: "left",
  radius: "lg",
  surface: "soft",
  blurIntensity: "medium",
  canvasStyle: "gradient",
  fontFamily: "manrope",
  displayFont: "fraunces",
  fontScale: "md",
  highContrast: false,
  reducedMotion: false,
  animationsEnabled: true,
  topbarStyle: "default",
  tableStyle: "minimal",
  cardStyle: "elevated",
  iconStyle: "outline",
  iconSize: "md",
  sidebarColor: "primary",
  chartPalette: "default",
  brandColor: null,
  appName: null,
  logoUrl: null,
  locale: "es-AR",
  touchMode: false,
}

export type ThemePreset = {
  id: string
  label: string
  description: string
  config: Partial<EmpresaTemaConfig>
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "porcelain",
    label: "Porcelana",
    description: "Blanco suave y premium",
    config: { palette: "porcelain", density: "comfortable", sidebarStyle: "inset", radius: "xl", surface: "soft", canvasStyle: "gradient" },
  },
  {
    id: "sand",
    label: "Arena",
    description: "Cálido, minimal",
    config: { palette: "sand", density: "default", sidebarStyle: "floating", radius: "lg", surface: "soft" },
  },
  {
    id: "sage",
    label: "Salvia",
    description: "Sobrio con acento verde",
    config: { palette: "sage", density: "default", sidebarStyle: "default", radius: "lg", surface: "clean", sidebarColor: "neutral" },
  },
  {
    id: "mist",
    label: "Niebla",
    description: "Frío elegante, glass",
    config: { palette: "mist", density: "comfortable", sidebarStyle: "inset", radius: "xl", surface: "glow", blurIntensity: "high" },
  },
  {
    id: "corporate",
    label: "Corporativo",
    description: "Azul profesional, tablas zebra",
    config: { palette: "blue", density: "compact", sidebarStyle: "default", radius: "md", surface: "clean", tableStyle: "zebra", topbarStyle: "compact" },
  },
  {
    id: "pos-touch",
    label: "POS táctil",
    description: "Botones grandes, alto contraste",
    config: { palette: "teal", density: "comfortable", radius: "xl", touchMode: true, fontScale: "lg", iconSize: "lg", highContrast: true },
  },
  {
    id: "night",
    label: "Nocturno",
    description: "Oscuro con glow violeta",
    config: { mode: "dark", palette: "violet", surface: "glow", canvasStyle: "minimal", sidebarStyle: "floating" },
  },
  {
    id: "glass-aurora",
    label: "Glass Aurora",
    description: "Cristal translúcido y auroras vibrantes",
    config: {
      mode: "dark",
      palette: "violet",
      surface: "glow",
      canvasStyle: "gradient",
      sidebarStyle: "floating",
      radius: "xl",
      blurIntensity: "high",
      cardStyle: "elevated",
    },
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Sin decoración, máximo foco",
    config: { palette: "neutral", surface: "clean", canvasStyle: "solid", cardStyle: "flat", animationsEnabled: false, radius: "sm" },
  },
]

export function mergeTemaConfig(partial?: Partial<EmpresaTemaConfig> | null): EmpresaTemaConfig {
  if (!partial || typeof partial !== "object") return { ...DEFAULT_TEMA_CONFIG }
  return { ...DEFAULT_TEMA_CONFIG, ...partial, version: 1 }
}