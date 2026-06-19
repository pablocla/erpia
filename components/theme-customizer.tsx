"use client"

import { useState } from "react"
import { useThemeConfig } from "@/lib/theme-config"
import { ThemeCustomizerPanel } from "@/components/theme-customizer-panel"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Paintbrush } from "lucide-react"

export function ThemeCustomizer() {
  const { canEdit } = useThemeConfig()
  const [open, setOpen] = useState(false)

  if (!canEdit) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Personalizar apariencia de la empresa"
        >
          <Paintbrush className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Personalizar</SheetTitle>
          <SheetDescription>Ajustá la apariencia del ERP para todos los usuarios</SheetDescription>
        </SheetHeader>
        <ThemeCustomizerPanel />
      </SheetContent>
    </Sheet>
  )
}