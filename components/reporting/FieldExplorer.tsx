"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import { GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface FieldItem {
  campo: string
  etiqueta: string
  tipo: string
}

function DraggableField({ field }: { field: FieldItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.campo}`,
    data: { field },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs cursor-grab",
        isDragging && "opacity-60 shadow-md",
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      <span>{field.etiqueta}</span>
      <Badge variant="outline" className="text-[9px] h-4 px-1">{field.tipo}</Badge>
    </div>
  )
}

function DropZone({
  id,
  title,
  items,
  onRemove,
}: {
  id: string
  title: string
  items: FieldItem[]
  onRemove: (campo: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-dashed p-2 min-h-[72px] transition-colors",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">Arrastrá campos aquí</span>
        ) : (
          items.map((f) => (
            <button
              key={f.campo}
              type="button"
              className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] hover:bg-muted/80"
              onClick={() => onRemove(f.campo)}
              title="Quitar"
            >
              {f.etiqueta} ×
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export function FieldExplorer({
  disponibles,
  filas,
  columnas,
  valores,
  onAssign,
  onRemove,
}: {
  disponibles: FieldItem[]
  filas: FieldItem[]
  columnas: FieldItem[]
  valores: FieldItem[]
  onAssign: (zone: "filas" | "columnas" | "valores", field: FieldItem) => void
  onRemove: (zone: "filas" | "columnas" | "valores", campo: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Campos disponibles</p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {disponibles.map((f) => (
            <DraggableField key={f.campo} field={f} />
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <DropZone id="zone-filas" title="Filas (pivot)" items={filas} onRemove={(c) => onRemove("filas", c)} />
        <DropZone id="zone-columnas" title="Columnas (pivot)" items={columnas} onRemove={(c) => onRemove("columnas", c)} />
        <DropZone id="zone-valores" title="Valores (medidas)" items={valores} onRemove={(c) => onRemove("valores", c)} />
      </div>
    </div>
  )
}

export function resolveDropZone(overId: string): "filas" | "columnas" | "valores" | null {
  if (overId === "zone-filas") return "filas"
  if (overId === "zone-columnas") return "columnas"
  if (overId === "zone-valores") return "valores"
  return null
}