"use client"

import { ThemeCustomizerPanel } from "@/components/theme-customizer-panel"
import { useThemeConfig } from "@/lib/theme-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AparienciaPage() {
  const { canEdit } = useThemeConfig()

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apariencia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configuración visual global de la empresa. Todos los usuarios ven el mismo tema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personalización del ERP</CardTitle>
          <CardDescription>
            {canEdit
              ? "Como administrador podés definir colores, tipografía, layout y marca para toda la organización."
              : "Contactá al dueño o administrador para cambiar la apariencia."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeCustomizerPanel />
        </CardContent>
      </Card>
    </div>
  )
}