"use client"

import Link from "next/link"
import { Settings, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"

export default function ClaverSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <CloudPageHeader
        icon={Settings}
        eyebrow="Configuración"
        title="Ajustes de la torre"
        description="Parámetros operativos para el equipo Claver. Los clientes finales configuran su ERP desde el dashboard."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:border-violet-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-violet-400" />
              Asignaciones de analistas
            </CardTitle>
            <CardDescription>
              Vinculá analistas Claver con organizaciones clientes para scope, notificaciones y acceso a la flota.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/claver-cloud/settings/assignments" className="flex items-center justify-center gap-2">
                Administrar asignaciones
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}