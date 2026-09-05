"use client"

import Link from "next/link"
import {
  Settings,
  Users,
  ArrowRight,
  Shield,
  CreditCard,
  Network,
  Wrench,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"

export default function ClaverSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <CloudPageHeader
        icon={Settings}
        eyebrow="Configuración"
        title="Ajustes de la Torre de Control"
        description="Parámetros operativos para el equipo fundador y analistas Claver. Gestión de asignaciones, límites de planes e integraciones."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-violet-500/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-violet-400" />
              Asignaciones de Analistas
            </CardTitle>
            <CardDescription className="text-xs">
              Vinculá analistas con organizaciones clientes para delimitación de scope, notificaciones y acceso a flotas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/claver-cloud/settings/assignments" className="flex items-center justify-center gap-2">
                Administrar asignaciones
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-500/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-emerald-400" />
              Salud & Secretos de Plataforma
            </CardTitle>
            <CardDescription className="text-xs">
              Verificá el checklist de variables de entorno de Vercel, Supabase, JWT y firmas de webhooks de Mercado Pago.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/claver-cloud/platform-health" className="flex items-center justify-center gap-2">
                Ver salud de plataforma
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-500/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Planes, Precios & MRR
            </CardTitle>
            <CardDescription className="text-xs">
              Límites de SKUs, características por nivel de suscripción y facturación recurrente de clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/claver-cloud/billing" className="flex items-center justify-center gap-2">
                Gestionar planes
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-500/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-5 w-5 text-amber-400" />
              Protocolo OPO & Protheus
            </CardTitle>
            <CardDescription className="text-xs">
              Consola del protocolo ontológico abierto para sincronizaciones ERP legacy y microservicios satélite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/claver-cloud/opo-console" className="flex items-center justify-center gap-2">
                Abrir consola OPO
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-500/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-purple-400" />
              Flota Multi-Tenant
            </CardTitle>
            <CardDescription className="text-xs">
              Visualizá todas las organizaciones, ejecutá diagnósticos y accedé en sesión impersonada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/claver-cloud/tenants" className="flex items-center justify-center gap-2">
                Ver flota completa
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}