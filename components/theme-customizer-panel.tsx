"use client"

import { useTheme } from "next-themes"
import { useThemeConfig, PALETTE_COLORS, THEME_PRESETS } from "@/lib/theme-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Sun, Moon, Monitor, RotateCcw, PanelLeft, PanelLeftDashed,
  Minimize2, Maximize2, SquareIcon, Droplets, Sparkles,
  Type, Table2, LayoutGrid, Palette, Globe, Accessibility,
  Hand, Save, Loader2,
} from "lucide-react"

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</Label>
      </div>
      {children}
    </div>
  )
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  disabled = false,
}: {
  options: { value: T; label: string; icon?: React.ElementType }[]
  value: T
  onChange: (v: T) => void
  columns?: number
  disabled?: boolean
}) {
  return (
    <div className={cn("grid gap-1.5", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-3", columns === 4 && "grid-cols-4")}>
      {options.map(({ value: v, label, icon: Icon }) => (
        <Button
          key={v}
          variant={value === v ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          disabled={disabled}
          onClick={() => onChange(v)}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </Button>
      ))}
    </div>
  )
}

export function ThemeCustomizerPanel({ className }: { className?: string }) {
  const { theme } = useTheme()
  const {
    config, canEdit, saving,
    setMode, setPalette, setDensity, setSidebarStyle, setSidebarPosition,
    setRadius, setSurface, setBlurIntensity, setCanvasStyle,
    setFontFamily, setDisplayFont, setFontScale,
    setHighContrast, setReducedMotion, setAnimationsEnabled,
    setTopbarStyle, setTableStyle, setCardStyle,
    setIconStyle, setIconSize, setSidebarColor, setChartPalette,
    setBrandColor, setAppName, setLogoUrl, setLocale, setTouchMode,
    applyConfig, resetConfig, saveNow,
  } = useThemeConfig()

  const disabled = !canEdit

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Apariencia de la empresa</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canEdit
              ? "Los cambios aplican a todos los usuarios de la empresa."
              : "Solo el dueño o administrador puede modificar estos ajustes."}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <Button variant="outline" size="sm" className="h-8" onClick={resetConfig} disabled={saving}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button size="sm" className="h-8" onClick={saveNow} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Guardar
            </Button>
          </div>
        )}
      </div>

      {saving && (
        <Badge variant="secondary" className="text-[10px]">Guardando para toda la empresa…</Badge>
      )}

      <Section title="Temas rápidos" icon={Sparkles}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEME_PRESETS.map((preset) => {
            const accent = PALETTE_COLORS[(preset.config.palette ?? config.palette) as keyof typeof PALETTE_COLORS]?.swatch ?? "#999"
            return (
              <button
                key={preset.id}
                disabled={disabled}
                onClick={() => applyConfig(preset.config)}
                className={cn(
                  "rounded-lg border p-2 text-left transition-all disabled:opacity-50",
                  config.palette === preset.config.palette ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <div className="h-8 rounded-md" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}55)` }} />
                <p className="text-[11px] font-semibold mt-1.5">{preset.label}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{preset.description}</p>
              </button>
            )
          })}
        </div>
      </Section>

      <Separator />

      <Section title="Modo y color" icon={Palette}>
        <OptionGrid
          disabled={disabled}
          options={[
            { value: "light" as const, label: "Claro", icon: Sun },
            { value: "dark" as const, label: "Oscuro", icon: Moon },
            { value: "system" as const, label: "Sistema", icon: Monitor },
          ]}
          value={config.mode}
          onChange={setMode}
        />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
          {(Object.keys(PALETTE_COLORS) as (keyof typeof PALETTE_COLORS)[]).map((key) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => setPalette(key)}
              className={cn(
                "flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all disabled:opacity-50",
                config.palette === key ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/50"
              )}
              title={PALETTE_COLORS[key].label}
            >
              <span className="h-5 w-5 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: PALETTE_COLORS[key].swatch }} />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{PALETTE_COLORS[key].label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">Color de marca (HEX)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={config.brandColor ?? "#3b82f6"}
                disabled={disabled}
                className="h-9 w-12 p-1 cursor-pointer"
                onChange={(e) => setBrandColor(e.target.value)}
              />
              <Input
                value={config.brandColor ?? ""}
                disabled={disabled}
                placeholder="#2563eb"
                className="h-9 text-xs font-mono"
                onChange={(e) => setBrandColor(e.target.value || null)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Paleta de gráficos</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "default" as const, label: "Default" },
                { value: "vibrant" as const, label: "Vivo" },
                { value: "pastel" as const, label: "Pastel" },
                { value: "mono" as const, label: "Mono" },
              ]}
              value={config.chartPalette}
              onChange={setChartPalette}
              columns={2}
            />
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Layout" icon={LayoutGrid}>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Densidad</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "compact" as const, label: "Compacto", icon: Minimize2 },
                { value: "default" as const, label: "Normal", icon: SquareIcon },
                { value: "comfortable" as const, label: "Espacioso", icon: Maximize2 },
              ]}
              value={config.density}
              onChange={setDensity}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Sidebar</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "default" as const, label: "Fijo", icon: PanelLeft },
                { value: "floating" as const, label: "Flotante", icon: PanelLeftDashed },
                { value: "inset" as const, label: "Glass", icon: PanelLeftDashed },
              ]}
              value={config.sidebarStyle}
              onChange={setSidebarStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Posición sidebar</Label>
              <OptionGrid
                options={[{ value: "left" as const, label: "Izquierda" }, { value: "right" as const, label: "Derecha" }]}
                value={config.sidebarPosition}
                onChange={setSidebarPosition}
                columns={2}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Color sidebar</Label>
              <OptionGrid
                options={[
                  { value: "primary" as const, label: "Primario" },
                  { value: "neutral" as const, label: "Neutral" },
                  { value: "dark" as const, label: "Oscuro" },
                ]}
                value={config.sidebarColor}
                onChange={setSidebarColor}
                columns={3}
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Topbar</Label>
            <OptionGrid
              disabled={disabled}
              options={[{ value: "default" as const, label: "Normal" }, { value: "compact" as const, label: "Compacta" }]}
              value={config.topbarStyle}
              onChange={setTopbarStyle}
              columns={2}
            />
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Superficie y fondo" icon={Droplets}>
        <OptionGrid
          disabled={disabled}
          options={[
            { value: "soft" as const, label: "Soft", icon: Droplets },
            { value: "clean" as const, label: "Clean", icon: SquareIcon },
            { value: "glow" as const, label: "Glow", icon: Sparkles },
          ]}
          value={config.surface}
          onChange={setSurface}
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Fondo dashboard</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "gradient" as const, label: "Gradiente" },
                { value: "solid" as const, label: "Sólido" },
                { value: "minimal" as const, label: "Minimal" },
              ]}
              value={config.canvasStyle}
              onChange={setCanvasStyle}
              columns={3}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Blur / glass</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "low" as const, label: "Bajo" },
                { value: "medium" as const, label: "Medio" },
                { value: "high" as const, label: "Alto" },
              ]}
              value={config.blurIntensity}
              onChange={setBlurIntensity}
              columns={3}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-[10px] text-muted-foreground mb-1 block">Bordes</Label>
          <OptionGrid
            disabled={disabled}
            options={[
              { value: "none" as const, label: "0" },
              { value: "sm" as const, label: "S" },
              { value: "md" as const, label: "M" },
              { value: "lg" as const, label: "L" },
              { value: "xl" as const, label: "XL" },
            ]}
            value={config.radius}
            onChange={setRadius}
            columns={5}
          />
        </div>
      </Section>

      <Separator />

      <Section title="Tipografía" icon={Type}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Fuente UI</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "manrope" as const, label: "Manrope" },
                { value: "inter" as const, label: "Inter" },
                { value: "system" as const, label: "Sistema" },
              ]}
              value={config.fontFamily}
              onChange={setFontFamily}
              columns={3}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Títulos</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "fraunces" as const, label: "Fraunces" },
                { value: "none" as const, label: "Sans" },
              ]}
              value={config.displayFont}
              onChange={setDisplayFont}
              columns={2}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-[10px] text-muted-foreground mb-1 block">Escala de texto</Label>
          <OptionGrid
            disabled={disabled}
            options={[
              { value: "sm" as const, label: "Chico" },
              { value: "md" as const, label: "Mediano" },
              { value: "lg" as const, label: "Grande" },
            ]}
            value={config.fontScale}
            onChange={setFontScale}
          />
        </div>
      </Section>

      <Separator />

      <Section title="Componentes" icon={Table2}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Tablas</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "minimal" as const, label: "Minimal" },
                { value: "zebra" as const, label: "Zebra" },
                { value: "bordered" as const, label: "Bordes" },
              ]}
              value={config.tableStyle}
              onChange={setTableStyle}
              columns={3}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Cards</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "flat" as const, label: "Plana" },
                { value: "elevated" as const, label: "Elevada" },
                { value: "outlined" as const, label: "Borde" },
              ]}
              value={config.cardStyle}
              onChange={setCardStyle}
              columns={3}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Iconos</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "outline" as const, label: "Outline" },
                { value: "filled" as const, label: "Filled" },
              ]}
              value={config.iconStyle}
              onChange={setIconStyle}
              columns={2}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Tamaño iconos</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "sm" as const, label: "S" },
                { value: "md" as const, label: "M" },
                { value: "lg" as const, label: "L" },
              ]}
              value={config.iconSize}
              onChange={setIconSize}
            />
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Accesibilidad y movimiento" icon={Accessibility}>
        <div className="space-y-3">
          {[
            { key: "highContrast", label: "Alto contraste", value: config.highContrast, set: setHighContrast },
            { key: "reducedMotion", label: "Reducir movimiento", value: config.reducedMotion, set: setReducedMotion },
            { key: "animationsEnabled", label: "Animaciones", value: config.animationsEnabled, set: setAnimationsEnabled },
            { key: "touchMode", label: "Modo táctil (POS)", value: config.touchMode, set: setTouchMode },
          ].map(({ key, label, value, set }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm font-normal">{label}</Label>
              <Switch checked={value} disabled={disabled} onCheckedChange={set} />
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      <Section title="Marca blanca" icon={Globe}>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">Nombre en sidebar</Label>
            <p className="text-[10px] text-muted-foreground/80 mb-1">Vacío muestra Clavis by Claver</p>
            <Input
              disabled={disabled}
              value={config.appName ?? ""}
              placeholder="Mi Empresa S.A."
              className="h-9 mt-1"
              onChange={(e) => setAppName(e.target.value || null)}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">URL del logo</Label>
            <Input
              disabled={disabled}
              value={config.logoUrl ?? ""}
              placeholder="https://..."
              className="h-9 mt-1"
              onChange={(e) => setLogoUrl(e.target.value || null)}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Idioma / región</Label>
            <OptionGrid
              disabled={disabled}
              options={[
                { value: "es-AR" as const, label: "es-AR" },
                { value: "es-MX" as const, label: "es-MX" },
                { value: "pt-BR" as const, label: "pt-BR" },
                { value: "en-US" as const, label: "en-US" },
              ]}
              value={config.locale}
              onChange={setLocale}
              columns={4}
            />
          </div>
        </div>
      </Section>

      <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Hand className="h-3.5 w-3.5 shrink-0" />
        <span>
          Modo actual: {theme} · {PALETTE_COLORS[config.palette].label} · {config.density} ·
          {config.touchMode ? " táctil" : ""} {canEdit ? "" : "(solo lectura)"}
        </span>
      </div>
    </div>
  )
}