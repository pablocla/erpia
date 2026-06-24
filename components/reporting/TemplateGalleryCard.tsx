"use client"

import {
  BarChart3,
  FileSpreadsheet,
  LayoutGrid,
  Package,
  Receipt,
  ShoppingCart,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { SheetTemplateSummary } from "@/lib/reporting/templates/types"
import { cn } from "@/lib/utils"

const ICONS: Record<string, LucideIcon> = {
  FileSpreadsheet,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Table2,
  LayoutGrid,
}

const CATEGORIA_LABEL: Record<string, string> = {
  ventas: "Ventas",
  clientes: "Clientes",
  stock: "Stock",
  compras: "Compras",
  fiscal: "Fiscal",
}

export function TemplateGalleryCard({
  template,
  onPreview,
}: {
  template: SheetTemplateSummary
  onPreview: () => void
}) {
  const Icon = ICONS[template.icono] ?? FileSpreadsheet

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors hover:border-primary/40",
        template.destacado && "border-primary/30 bg-primary/[0.02]",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("rounded-lg bg-muted p-2", template.color)}>
            <Icon className="h-5 w-5" />
          </div>
          {template.destacado && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2 leading-snug">{template.nombre}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.descripcion}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px] capitalize">
            {CATEGORIA_LABEL[template.categoria] ?? template.categoria}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {template.vista}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="sm" onClick={onPreview}>
          Ver ejemplo
        </Button>
      </CardFooter>
    </Card>
  )
}