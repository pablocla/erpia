"use client"

import Link from "next/link"
import { Suspense } from "react"
import {
  Network,
  Sparkles,
  Store,
  ShoppingBag,
  Layers,
  Settings,
  ArrowRight,
  MessageCircle,
  CalendarCheck,
  Bot,
  Banknote,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppStoreGrid } from "@/components/marketplace/app-store-grid"
import { ProductControlPanel } from "@/components/platform/product-control-panel"
import { MpCheckoutReturn } from "@/components/billing/mp-checkout-return"

export function AppsPageTabs() {
  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Centro de Módulos & Aplicaciones</h1>
        <p className="text-muted-foreground text-sm">
          Explorá el catálogo de apps, activá paquetes por industria y gestioná los módulos encendidos en tu empresa.
        </p>
      </div>

      <Suspense>
        <MpCheckoutReturn />
      </Suspense>

      <Tabs defaultValue="catalogo" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="catalogo" className="rounded-lg gap-2 text-xs md:text-sm font-medium">
            <ShoppingBag className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="empleados" className="rounded-lg gap-2 text-xs md:text-sm font-medium">
            <Bot className="h-4 w-4" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="packs" className="rounded-lg gap-2 text-xs md:text-sm font-medium">
            <Layers className="h-4 w-4" />
            Packs
          </TabsTrigger>
          <TabsTrigger value="mis-modulos" className="rounded-lg gap-2 text-xs md:text-sm font-medium">
            <Settings className="h-4 w-4" />
            Mis Módulos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Catálogo Marketplace */}
        <TabsContent value="catalogo" className="space-y-6">
          <Suspense>
            <AppStoreGrid />
          </Suspense>
        </TabsContent>

        {/* Tab Empleados digitales (MKT-01) */}
        <TabsContent value="empleados" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Empleados digitales</h2>
            <p className="text-sm text-muted-foreground">
              Equipo híbrido: reglas + WhatsApp. Activá en 1 clic y aprobá los mensajes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col justify-between border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white">$19.900/mes · trial 7d</Badge>
                  <Banknote className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="mt-2 text-xl">Leo Cobranza</CardTitle>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Escanea deudas y fiados, arma WhatsApp con link Mercado Pago y te deja aprobar. 80% plantilla, casi
                  0 tokens.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                  <Link href="/dashboard/empleados-digitales/leo_cobranza?onboarding=1">
                    Abrir Leo
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/empleados-digitales">Ver equipo</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link href="/dashboard/apps?sku=empleado.leo_cobranza">Activar SKU</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-between border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent opacity-90">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Próximamente</Badge>
                  <CalendarCheck className="h-5 w-5 text-sky-600" />
                </div>
                <CardTitle className="mt-2 text-xl">Sofía Confirmá</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Turnos que se confirman solos por WhatsApp. Menos ausencias.
                </p>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="secondary" disabled>
                  En roadmap
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-between border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent opacity-90">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Próximamente</Badge>
                  <Store className="h-5 w-5 text-violet-600" />
                </div>
                <CardTitle className="mt-2 text-xl">Ramiro Stock</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alertas de reposición e inflación en listas de precio.
                </p>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="secondary" disabled>
                  En roadmap
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Packs */}
        <TabsContent value="packs" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Soluciones Integradas & Packs por Rubro</h2>
            <p className="text-sm text-muted-foreground">
              Accedé a los suites pre-configurados diseñados específicamente para cada modelo de negocio.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Pack Almacén Rosario */}
            <Card className="flex flex-col justify-between border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-orange-500/40 text-orange-600 bg-orange-500/10">
                    Almacén & Kiosco
                  </Badge>
                  <Store className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-xl mt-2">Pack Almacén Rosario</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  18 módulos integrados: protección de margen, envases, vales de dinero, recargas, balanza de peso, promos 2×1 y más.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap pt-2">
                  <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    <Link href="/dashboard/almacen">
                      Ir al Panel
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/almacen/guia">Guía de uso</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="text-xs text-muted-foreground">
                    <Link href="/claver/almacen-rosario">Ver vitrina</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Premium ERP 7 */}
            <Card className="flex flex-col justify-between border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-violet-500/40 text-violet-600 bg-violet-500/10">
                    Enterprise
                  </Badge>
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <CardTitle className="text-xl mt-2">Premium ERP 7</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Guardián POS, liquidación Mercado Pago, conciliación fiscal, reposición JIT y lector OCR de facturas.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-500 text-white w-full sm:w-auto">
                  <Link href="/dashboard/apps/premium">
                    Abrir Panel Premium
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* OPO Studio Bridge */}
            <Card className="flex flex-col justify-between border-slate-500/30 bg-gradient-to-br from-slate-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-slate-500/40 text-slate-600 bg-slate-500/10">
                    Integración SQL / ERP
                  </Badge>
                  <Network className="h-5 w-5 text-slate-500" />
                </div>
                <CardTitle className="text-xl mt-2">OPO Studio Bridge</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Ontología conectora sobre TOTVS Protheus o Claver nativo. REST/SQL API, descubrimiento y playground IA.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                  <Link href="/dashboard/apps/opo">
                    Abrir Panel OPO
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Claver Cobrá */}
            <Card className="flex flex-col justify-between border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10">
                    Sub-SaaS · $20.000/mes
                  </Badge>
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-xl mt-2">Claver Cobrá</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Mensajes WhatsApp automatizados de cobro con botones de pago Mercado Pago y recibo digital.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Link href="/dashboard/fiado">
                      Ir a Fiado / Cobranza
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/apps?sku=intang.cobranzas_wa">Activar en catálogo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Claver Confirmá */}
            <Card className="flex flex-col justify-between border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-sky-500/40 text-sky-700 bg-sky-500/10">
                    Sub-SaaS · $14.900/mes
                  </Badge>
                  <CalendarCheck className="h-5 w-5 text-sky-600" />
                </div>
                <CardTitle className="text-xl mt-2">Claver Confirmá</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Turnos que se confirman solos por WhatsApp. Menos ausencias, agenda llena.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-500 text-white">
                    <Link href="/dashboard/agenda">
                      Abrir Agenda
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/apps?sku=channel.whatsapp">Ver comunicaciones</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Mis Módulos Activos */}
        <TabsContent value="mis-modulos" className="space-y-6">
          <ProductControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
