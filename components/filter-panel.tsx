"use client"

/**
 * FilterPanel — Advanced configurable filter panel
 *
 * Provides multi-field filtering with saved presets.
 * Supports: text, select, date range, number range, boolean.
 * Competitors: SAP B1 advanced filter, Odoo domain builder, Tango filters.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  SlidersHorizontal,
  X,
  Plus,
  Save,
  Bookmark,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FilterField {
  key: string
  label: string
  type: "text" | "select" | "date" | "date-range" | "number-range" | "boolean"
  /** Options for select type */
  options?: { value: string; label: string }[]
  /** Placeholder text */
  placeholder?: string
}

export interface FilterValues {
  [key: string]: string | number | boolean | { from?: string; to?: string } | undefined
}

export interface FilterPreset {
  id: string
  name: string
  values: FilterValues
}

interface FilterPanelProps {
  fields: FilterField[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  /** Presets saved by user */
  presets?: FilterPreset[]
  onSavePreset?: (name: string, values: FilterValues) => void
  onLoadPreset?: (preset: FilterPreset) => void
  onDeletePreset?: (id: string) => void
  /** Mode: sheet (sidebar panel) or popover (dropdown) */
  mode?: "sheet" | "popover"
}

export function FilterPanel({
  fields,
  values,
  onChange,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  mode = "popover",
}: FilterPanelProps) {
  const [presetName, setPresetName] = React.useState("")
  const activeCount = Object.values(values).filter((v) =>
    v !== undefined && v !== "" && v !== false &&
    !(typeof v === "object" && !v.from && !v.to)
  ).length

  function updateField(key: string, value: unknown) {
    onChange({ ...values, [key]: value as FilterValues[string] })
  }

  function clearAll() {
    const empty: FilterValues = {}
    fields.forEach((f) => { empty[f.key] = undefined })
    onChange(empty)
  }

  function clearField(key: string) {
    onChange({ ...values, [key]: undefined })
  }

  const content = (
    <div className="space-y-4">
      {/* Presets */}
      {presets.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Filtros guardados</Label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Badge
                key={p.id}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 gap-1"
                onClick={() => onLoadPreset?.(p)}
              >
                <Bookmark className="h-3 w-3" />
                {p.name}
                {onDeletePreset && (
                  <button
                    className="ml-0.5 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id) }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          <Separator className="mt-3" />
        </div>
      )}

      {/* Filter fields */}
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{field.label}</Label>
            {values[field.key] !== undefined && values[field.key] !== "" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-1"
                onClick={() => clearField(field.key)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>

          {field.type === "text" && (
            <Input
              placeholder={field.placeholder ?? `Filtrar ${field.label.toLowerCase()}...`}
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => updateField(field.key, e.target.value || undefined)}
              className="h-8 text-sm"
            />
          )}

          {field.type === "select" && (
            <Select
              value={(values[field.key] as string) ?? ""}
              onValueChange={(v) => updateField(field.key, v === "__clear__" ? undefined : v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={field.placeholder ?? "Todos"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">Todos</SelectItem>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "date" && (
            <Input
              type="date"
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => updateField(field.key, e.target.value || undefined)}
              className="h-8 text-sm"
            />
          )}

          {field.type === "date-range" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                placeholder="Desde"
                value={
                  (values[field.key] as { from?: string; to?: string })?.from ?? ""
                }
                onChange={(e) => {
                  const current = (values[field.key] as { from?: string; to?: string }) ?? {}
                  updateField(field.key, { ...current, from: e.target.value || undefined })
                }}
                className="h-8 text-sm flex-1"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="date"
                placeholder="Hasta"
                value={
                  (values[field.key] as { from?: string; to?: string })?.to ?? ""
                }
                onChange={(e) => {
                  const current = (values[field.key] as { from?: string; to?: string }) ?? {}
                  updateField(field.key, { ...current, to: e.target.value || undefined })
                }}
                className="h-8 text-sm flex-1"
              />
            </div>
          )}

          {field.type === "number-range" && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Mín"
                value={
                  (values[field.key] as { from?: string; to?: string })?.from ?? ""
                }
                onChange={(e) => {
                  const current = (values[field.key] as { from?: string; to?: string }) ?? {}
                  updateField(field.key, { ...current, from: e.target.value || undefined })
                }}
                className="h-8 text-sm flex-1"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="Máx"
                value={
                  (values[field.key] as { from?: string; to?: string })?.to ?? ""
                }
                onChange={(e) => {
                  const current = (values[field.key] as { from?: string; to?: string }) ?? {}
                  updateField(field.key, { ...current, to: e.target.value || undefined })
                }}
                className="h-8 text-sm flex-1"
              />
            </div>
          )}

          {field.type === "boolean" && (
            <div className="flex items-center gap-2">
              <Switch
                checked={!!values[field.key]}
                onCheckedChange={(v) => updateField(field.key, v || undefined)}
              />
              <span className="text-sm text-muted-foreground">
                {values[field.key] ? "Sí" : "No"}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Actions */}
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearAll}>
          <RotateCcw className="h-3 w-3" />
          Limpiar filtros
        </Button>
        {onSavePreset && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Save className="h-3 w-3" />
                Guardar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" side="top">
              <div className="space-y-2">
                <Label className="text-xs">Nombre del filtro</Label>
                <Input
                  placeholder="Ej: Ventas mes actual"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={!presetName.trim()}
                  onClick={() => {
                    onSavePreset(presetName.trim(), values)
                    setPresetName("")
                  }}
                >
                  Guardar preset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )

  if (mode === "sheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {activeCount > 0 && (
              <Badge className="h-5 min-w-5 text-[10px] px-1 ml-0.5">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros avanzados
              {activeCount > 0 && (
                <Badge variant="secondary" className="h-5 text-[10px]">
                  {activeCount} activo{activeCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <Badge className="h-5 min-w-5 text-[10px] px-1 ml-0.5">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        {content}
      </PopoverContent>
    </Popover>
  )
}
