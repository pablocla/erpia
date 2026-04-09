"use client"

import { useTheme } from "next-themes"
import {
  useThemeConfig,
  PALETTE_COLORS,
  type Palette,
  type Density,
  type SidebarStyle,
  type RadiusPreset,
  type Surface,
} from "@/lib/theme-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Paintbrush,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  PanelLeft,
  PanelLeftDashed,
  Minimize2,
  Maximize2,
  SquareIcon,
  Droplets,
  Sparkles,
} from "lucide-react"

const MODE_OPTIONS = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
]

const DENSITY_OPTIONS: { value: Density; label: string; icon: React.ElementType }[] = [
  { value: "compact", label: "Compacto", icon: Minimize2 },
  { value: "default", label: "Normal", icon: SquareIcon },
  { value: "comfortable", label: "Espacioso", icon: Maximize2 },
]

const RADIUS_OPTIONS: { value: RadiusPreset; label: string; preview: string }[] = [
  { value: "none", label: "0", preview: "rounded-none" },
  { value: "sm", label: "S", preview: "rounded-sm" },
  { value: "md", label: "M", preview: "rounded-md" },
  { value: "lg", label: "L", preview: "rounded-lg" },
  { value: "xl", label: "XL", preview: "rounded-xl" },
]

const SIDEBAR_OPTIONS: { value: SidebarStyle; label: string; icon: React.ElementType }[] = [
  { value: "default", label: "Fijo", icon: PanelLeft },
  { value: "floating", label: "Flotante", icon: PanelLeftDashed },
  { value: "inset", label: "Glass", icon: PanelLeftDashed },
]

const SURFACE_OPTIONS: { value: Surface; label: string; icon: React.ElementType }[] = [
  { value: "soft", label: "Soft", icon: Droplets },
  { value: "clean", label: "Clean", icon: SquareIcon },
  { value: "glow", label: "Glow", icon: Sparkles },
]

const SURFACE_LABELS: Record<Surface, string> = {
  soft: "Soft",
  clean: "Clean",
  glow: "Glow",
}

const PALETTE_GROUPS: { label: string; palettes: Palette[] }[] = [
  { label: "Suaves", palettes: ["porcelain", "sand", "sage", "mist", "neutral"] },
  { label: "Vivos", palettes: ["blue", "teal", "green", "amber", "orange", "rose", "violet"] },
]

type ThemePreset = {
  id: string
  label: string
  description: string
  config: {
    palette: Palette
    density: Density
    sidebarStyle: SidebarStyle
    radius: RadiusPreset
    surface: Surface
  }
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "porcelain",
    label: "Porcelana",
    description: "Blanco suave y premium",
    config: { palette: "porcelain", density: "comfortable", sidebarStyle: "inset", radius: "xl", surface: "soft" },
  },
  {
    id: "sand",
    label: "Arena",
    description: "Calido, minimal, sin ruido",
    config: { palette: "sand", density: "default", sidebarStyle: "floating", radius: "lg", surface: "soft" },
  },
  {
    id: "sage",
    label: "Salvia",
    description: "Sobrio con acento verde",
    config: { palette: "sage", density: "default", sidebarStyle: "default", radius: "lg", surface: "clean" },
  },
  {
    id: "mist",
    label: "Niebla",
    description: "Frio elegante, glass",
    config: { palette: "mist", density: "comfortable", sidebarStyle: "inset", radius: "xl", surface: "glow" },
  },
]

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme()
  const {
    config,
    setPalette,
    setDensity,
    setSidebarStyle,
    setRadius,
    setSurface,
    applyConfig,
    resetConfig,
  } = useThemeConfig()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Personalizar tema"
        >
          <Paintbrush className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h4 className="text-sm font-semibold">Personalizar</h4>
            <p className="text-[11px] text-muted-foreground">Ajustá la apariencia del sistema</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetConfig} title="Restaurar predeterminado">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temas</Label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((preset) => {
                const accent = PALETTE_COLORS[preset.config.palette]?.swatch ?? "#999999"
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyConfig(preset.config)}
                    className={cn(
                      "group rounded-lg border p-2 text-left transition-all",
                      config.palette === preset.config.palette && config.surface === preset.config.surface
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/60 hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <div
                      className="h-10 w-full rounded-md border border-background/60"
                      style={{
                        background: `linear-gradient(135deg, ${accent}22, ${accent}55)`,
                      }}
                    />
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-foreground">{preset.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-snug">{preset.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />
          {/* Mode */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modo</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Palette */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color primario</Label>
            <div className="space-y-3">
              {PALETTE_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{group.label}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.palettes.map((key) => {
                      const { label, swatch } = PALETTE_COLORS[key]
                      return (
                        <button
                          key={key}
                          onClick={() => setPalette(key)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                            config.palette === key
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-transparent hover:border-border hover:bg-muted/50"
                          )}
                          title={label}
                        >
                          <span
                            className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: swatch }}
                          />
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Radius */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bordes</Label>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={config.radius === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setRadius(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Surface */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Superficie</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {SURFACE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={config.surface === value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setSurface(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Density */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Densidad</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {DENSITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={config.density === value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setDensity(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sidebar style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sidebar</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {SIDEBAR_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={config.sidebarStyle === value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setSidebarStyle(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview strip */}
        <div className="border-t px-4 py-2.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="h-3 w-3 rounded-full bg-secondary" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-destructive" />
            </div>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {PALETTE_COLORS[config.palette].label} · {SURFACE_LABELS[config.surface]} · {config.radius.toUpperCase()} · {config.density}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
