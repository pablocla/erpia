"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowRight, Store, Globe, Truck, UtensilsCrossed, Factory, Layers, Calculator, CreditCard, Palette, HelpCircle, FileText, Package, BookOpen, Cpu, Bot, Check, Sparkles, ShoppingCart, Wallet, Target, UserCircle, GraduationCap, Search, Star, TrendingUp, Shield, Zap, Building2, MessageSquare } from "lucide-react"

const IconMap = {
  Store,
  Globe,
  Truck,
  UtensilsCrossed,
  Factory,
  Layers,
  Calculator,
  CreditCard,
  Palette,
  FileText,
  Package,
  BookOpen,
  Cpu,
  Bot,
  ShoppingCart,
  Wallet,
  Target,
  UserCircle,
  GraduationCap
}

import { ClaverShell } from "@/components/marketing/claver-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { HUB_SOLUTIONS } from "@/lib/marketing/solutions-catalog"
import { CLAVERP_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"
import { LogoShowcase } from "@/components/marketing/logo-showcase"
import { IntegrationsNovedades } from "@/components/marketing/integrations-novedades"
import { ClavisPricingSection } from "@/components/marketing/clavis-pricing-section"
import { MODULO_CATEGORIAS } from "@/lib/marketing/modulos-catalog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function ClavERPProductHub() {
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    pos: true,
    afip: true,
    stock: true,
    ecom: false,
    logistica: false,
    mrp: false,
    agro: false,
    contabilidad: false,
    automation: false,
    ia: false,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [activeGroup, setActiveGroup] = useState<"all" | "core" | "channels" | "verticals" | "tech">("all")

  const groupMappings: Record<string, "core" | "channels" | "verticals" | "tech"> = {
    ventas: "core",
    stock: "core",
    compras: "core",
    financiero: "core",
    contabilidad: "core",
    fiscal: "core",
    canales: "channels",
    logistica: "channels",
    rubro: "channels",
    industria: "verticals",
    agro: "verticals",
    comercial: "tech",
    rrhh: "tech",
    iot: "tech",
    ia: "tech",
    capacitacion: "tech",
  }

  const filteredCategories = MODULO_CATEGORIAS.filter((cat) => {
    const matchesSearch =
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (activeGroup === "all") return matchesSearch
    return matchesSearch && groupMappings[cat.id] === activeGroup
  })

  const erpMicroServices = [
    { id: "pos", name: "Punto de Venta POS", price: 29900, category: "Ventas", desc: "Mostrador táctil, cierre de caja y arqueos.", icon: Store },
    { id: "afip", name: "Facturación AFIP Nativa", price: 14900, category: "Administración", desc: "CAE inmediato, libros de IVA y CITI.", icon: FileText },
    { id: "ecom", name: "E-commerce B2C/B2B", price: 24900, category: "Canales", desc: "Tienda online y portal mayorista con CUIT.", icon: Globe },
    { id: "stock", name: "Stock & Depósitos", price: 14900, category: "Logística", desc: "Trazabilidad, inventario y alertas críticas.", icon: Package },
    { id: "logistica", name: "Logística & Reparto", price: 29900, category: "Logística", desc: "Rutas preventa, app de choferes y POD.", icon: Truck },
    { id: "mrp", name: "Producción & MRP", price: 39900, category: "Industria", desc: "Lista de materiales (BOM) y control de calidad.", icon: Factory },
    { id: "agro", name: "Balanza & Acopio Granos", price: 49900, category: "Agro", desc: "Pesadas de balanza, contratos y cartas de porte.", icon: Layers },
    { id: "contabilidad", name: "Contabilidad Automática", price: 19900, category: "Administración", desc: "Asientos automáticos por evento y balances.", icon: BookOpen },
    { id: "automation", name: "Automation Hub", price: 29900, category: "Tecnología", desc: "Integraciones IoT, flujos n8n y webhooks.", icon: Cpu },
    { id: "ia", name: "Morning Commander IA", price: 19900, category: "Tecnología", desc: "Asistente virtual y reportes de operación con IA.", icon: Bot },
  ]

  const toggleService = (id: string) => {
    setSelectedServices(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const customTotal = Object.entries(selectedServices).reduce((acc, [id, active]) => {
    if (!active) return acc
    const service = erpMicroServices.find(s => s.id === id)
    return acc + (service?.price ?? 0)
  }, 0)

  return (
    <ClaverShell context="claverp">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 pt-28 pb-24 text-white sm:pt-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Link
              href="/claver"
              className="mb-6 inline-flex items-center text-sm text-slate-400 hover:text-white"
            >
              ← Grupo {CLAVER_GROUP.name}
            </Link>
            <div className="mb-6">
              <BrandLogo size="lg" theme="dark" variant="claverp-full" />
            </div>
            <Badge className="mb-4 border-blue-400/30 bg-blue-500/15 text-blue-200">
              Línea ERP · 40+ módulos
            </Badge>
            <h1 className="max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl">
              {CLAVERP_PRODUCT.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-400">{CLAVERP_PRODUCT.descriptor}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500" asChild>
                <Link href="/login">
                  Probar demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
                asChild
              >
                <Link href="/claver/claverp/modulos">Ver módulos</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-teal-400/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-100"
                asChild
              >
                <Link href="/claver/claverp/conexiones">30+ conexiones nativas</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100"
                asChild
              >
                <Link href="#precios">Ver planes y precios</Link>
              </Button>
            </div>
          </MotionFadeDown>
          <LogoShowcase variant="claverp" />
        </div>
      </section>

      <IntegrationsNovedades variant="novedades" showStats={false} />

      {/* Métricas / Social Proof strip */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "40+", label: "Módulos integrados", icon: Zap },
              { value: "500+", label: "PyMEs activas", icon: Building2 },
              { value: "$2.4B+", label: "Facturado con CAE", icon: TrendingUp },
              { value: "99.7%", label: "Uptime garantizado", icon: Shield },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Soluciones por vertical */}
      <section className="bg-[#f8fafc] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Soluciones Clavis por vertical
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              Landings dedicadas dentro del ecosistema {CLAVER_GROUP.name}.
            </p>
          </ScrollReveal>

          <MotionList className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_SOLUTIONS.map((sol) => {
              const Icon = IconMap[sol.icon as keyof typeof IconMap] || HelpCircle
              return (
                <MotionListItem key={sol.slug}>
                  <Link href={`/claver/claverp/${sol.slug}`} className="block h-full">
                    <Card className="group h-full border-slate-200/80 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${sol.heroGradient} text-white`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-2xl">{sol.emoji}</span>
                        </div>
                        <CardTitle className="mt-4 font-[var(--font-fraunces)] text-lg group-hover:text-blue-700">
                          {sol.headline.split(" ").slice(0, 5).join(" ")}…
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 text-sm text-slate-600">{sol.subheadline}</p>
                        {sol.planFrom > 0 && (
                          <p className="mt-3 text-sm font-medium text-blue-700">
                            Desde {currency.format(sol.planFrom)}/mes
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </MotionListItem>
              )
            })}
          </MotionList>

          {/* SECCIÓN NUEVA: BÚSQUEDA Y FILTRADO DE TODOS LOS MICROSERVICIOS */}
          <ScrollReveal className="mt-24 border-t border-slate-200/60 pt-16">
            <div className="text-center space-y-3 mb-10">
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                Ecosistema Modular
              </Badge>
              <h3 className="font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">
                Explorá todos los Microservicios & Módulos
              </h3>
              <p className="text-sm text-slate-650 max-w-xl mx-auto">
                Buscá entre las capacidades operativas integradas en la plataforma. Todo unificado en el mismo sistema.
              </p>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8 max-w-4xl mx-auto">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                <Input
                  type="text"
                  placeholder="Buscar módulo (ej: stock, AFIP, comanda, sueldos...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-10 border-slate-200 bg-white placeholder:text-slate-400 rounded-xl w-full"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "Todos" },
                  { id: "core", label: "Core & Finanzas" },
                  { id: "channels", label: "Canales & Logística" },
                  { id: "verticals", label: "Verticales" },
                  { id: "tech", label: "Tecnología & IA" },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setActiveGroup(btn.id as any)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                      activeGroup === btn.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grilla de Microservicios */}
            {filteredCategories.length > 0 ? (
              <MotionList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((mod) => {
                  const ModIcon = mod.icon
                  return (
                    <MotionListItem key={mod.id}>
                      <Card className="group h-full border-slate-200/80 bg-white/70 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-start justify-between">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 bg-gradient-to-br shadow-xs", mod.gradient)}>
                              <ModIcon className={cn("h-5 w-5", mod.color)} />
                            </div>
                            {mod.badge && (
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold">
                                {mod.badge}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="font-[var(--font-fraunces)] text-lg text-slate-900 group-hover:text-blue-700">
                            {mod.label}
                          </CardTitle>
                          <p className="text-xs text-slate-500 leading-relaxed">{mod.tagline}</p>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                            {mod.highlights.slice(0, 4).map((h) => (
                              <li key={h} className="flex items-start gap-2 text-xs text-slate-650">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </MotionListItem>
                  )
                })}
              </MotionList>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                No se encontraron módulos que coincidan con tu búsqueda.
              </div>
            )}
          </ScrollReveal>

          {/* SECCIÓN INTERACTIVA: CONFIGURADOR DE MICROSERVICIOS ERP */}
          <ScrollReveal className="mt-24 border-t border-slate-200/60 pt-16">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.3)] text-left">
              
              <div className="text-center space-y-3 mb-10">
                <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 inline animate-pulse" />
                  Cotizador de Procesos Clavis
                </Badge>
                <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900 md:text-3xl">
                  Diseñá tu propia infraestructura operativa
                </h3>
                <p className="text-sm text-slate-600 max-w-xl mx-auto">
                  Seleccioná los microservicios que necesita tu PyME para modelar tu flujo ideal y estimar tu presupuesto mensual.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                
                {/* Toggles de Microservicios */}
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Módulos & Microservicios</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {erpMicroServices.map((service) => {
                      const active = selectedServices[service.id]
                      const Icon = service.icon
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none ${
                            active
                              ? "border-blue-500 bg-blue-500/5 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                              active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-950">{service.name}</h4>
                              <span className="text-[10px] uppercase font-bold text-slate-400">{service.category}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-slate-500 leading-relaxed min-h-[32px]">
                            {service.desc}
                          </p>
                          <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-semibold text-slate-800">
                            <span>Costo mensual</span>
                            <span className={active ? "text-blue-700 font-bold" : "text-slate-600"}>
                              {currency.format(service.price)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pipeline visual en vivo */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Simulación del Flujo de Trabajo</h4>
                      <p className="text-[11px] text-slate-500">Activando módulos se orquestan los siguientes pasos:</p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { id: "pos", label: "Venta Mostrador POS", active: selectedServices["pos"], icon: Store },
                        { id: "ecom", label: "Tienda Online / Portal B2B", active: selectedServices["ecom"], icon: Globe },
                        { id: "stock", label: "Control de Stock & Picking", active: selectedServices["stock"], icon: Package },
                        { id: "logistica", label: "Reparto & Hojas de Ruta", active: selectedServices["logistica"], icon: Truck },
                        { id: "mrp", label: "Planificación de Fábrica (MRP)", active: selectedServices["mrp"], icon: Factory },
                        { id: "agro", label: "Pesada Balanza & CPE", active: selectedServices["agro"], icon: Layers },
                        { id: "contabilidad", label: "Generación Asiento Contable", active: selectedServices["contabilidad"], icon: BookOpen },
                        { id: "automation", label: "n8n Workflow Hub", active: selectedServices["automation"], icon: Cpu },
                        { id: "ia", label: "Morning Commander Report IA", active: selectedServices["ia"], icon: Bot }
                      ].map((node) => {
                        const NodeIcon = node.icon
                        return (
                          <div
                            key={node.id}
                            className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 text-xs ${
                              node.active
                                ? "border-blue-350 bg-blue-500/5 text-slate-900 font-medium shadow-sm"
                                : "border-slate-100 bg-white/40 text-slate-400 opacity-40"
                            }`}
                          >
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                              node.active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                            }`}>
                              <NodeIcon className="h-4 w-4" />
                            </div>
                            <span>{node.label}</span>
                            {node.active && (
                              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Totalizador */}
                  <div className="mt-8 border-t border-slate-200 pt-6 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-xs text-slate-500 block">Presupuesto mensual estimado</span>
                        <span className="text-[10px] text-slate-400 font-semibold">* Precios ARS + IVA</span>
                      </div>
                      <div className="text-right">
                        <span className="font-[var(--font-fraunces)] text-3xl font-bold text-slate-950">
                          {currency.format(customTotal)}
                        </span>
                        <span className="text-slate-500 text-xs">/mes</span>
                      </div>
                    </div>

                    <Button className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800" asChild>
                      <Link href="/login">
                        Probar este proceso integral
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                </div>

              </div>

            </div>
          </ScrollReveal>

          {/* PLANES Y PRECIOS EMPAQUETADOS */}
          <ClavisPricingSection compact />

          <ScrollReveal className="mt-10 flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/claver/claverp/precios">Precios completos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/claver">Volver a {CLAVER_GROUP.name}</Link>
            </Button>
          </ScrollReveal>

          {/* TESTIMONIOS */}
          <ScrollReveal className="mt-24 border-t border-slate-200/60 pt-16">
            <div className="text-center mb-12">
              <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-800">
                <Star className="mr-1.5 h-3.5 w-3.5 inline fill-yellow-400 text-yellow-400" />
                Testimonios
              </Badge>
              <h3 className="mt-4 font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">
                Lo que dicen nuestros clientes
              </h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote: "Implementamos Clavis en 3 días y en la primera semana ya facturamos electrónicamente con CAE sin problemas. El soporte en español hace la diferencia.",
                  name: "Alejandra G.",
                  role: "Distribuidora de Alimentos · Buenos Aires",
                  rating: 5,
                },
                {
                  quote: "Teníamos 3 sistemas separados: ERP, tienda web y facturación. Con Clavis todo queda en uno solo y el stock se actualiza en tiempo real.",
                  name: "Martín P.",
                  role: "Ferretería Industrial · Córdoba",
                  rating: 5,
                },
                {
                  quote: "El módulo de logística nos permitió reducir errores de reparto en un 80%. Las hojas de ruta digitales son increíbles para nuestra operación.",
                  name: "Cecilia R.",
                  role: "Distribuidora Mayorista · Rosario",
                  rating: 5,
                },
              ].map((t) => (
                <Card key={t.name} className="flex flex-col border-slate-200/80 bg-white shadow-sm">
                  <CardContent className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="flex-1 text-sm text-slate-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollReveal>

          {/* INTEGRACIONES */}
          <ScrollReveal className="mt-24 border-t border-slate-200/60 pt-16">
            <div className="text-center mb-12">
              <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
                Integraciones Nativas
              </Badge>
              <h3 className="mt-4 font-[var(--font-fraunces)] text-3xl font-bold text-slate-900">
                Conectado con el ecosistema argentino
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
                Sin APIs de terceros riesgosas. Integraciones propias y mantenidas por el equipo.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                { name: "AFIP / ARCA", desc: "Factura electrónica, CAE, CAEA, CITI.", color: "bg-blue-50", textColor: "text-blue-700", icon: FileText },
                { name: "Mercado Pago", desc: "QR, link de pago y tarjetas en el checkout.", color: "bg-cyan-50", textColor: "text-cyan-700", icon: CreditCard },
                { name: "Mercado Libre", desc: "Sincronización de publicaciones y pedidos.", color: "bg-yellow-50", textColor: "text-yellow-700", icon: ShoppingCart },
                { name: "WhatsApp Business", desc: "Notificaciones y tracking automático.", color: "bg-green-50", textColor: "text-green-700", icon: MessageSquare },
                { name: "ARBA / AGIP", desc: "Percepciones y retenciones provinciales.", color: "bg-purple-50", textColor: "text-purple-700", icon: Target },
                { name: "n8n Automation", desc: "Flujos de automatización y webhooks.", color: "bg-orange-50", textColor: "text-orange-700", icon: Cpu },
                { name: "PostgreSQL / Supabase", desc: "Base de datos segura con backup diario.", color: "bg-teal-50", textColor: "text-teal-700", icon: Shield },
                { name: "OpenAI / Gemini IA", desc: "Asistente IA y reportes automáticos.", color: "bg-indigo-50", textColor: "text-indigo-700", icon: Bot },
              ].map((integ) => {
                const Icon = integ.icon
                return (
                  <div key={integ.name} className={`rounded-2xl border border-slate-100 ${integ.color} p-5 transition-all hover:shadow-sm`}>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 mb-3 ${integ.textColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className={`text-sm font-bold ${integ.textColor}`}>{integ.name}</div>
                    <div className="mt-1 text-xs text-slate-500 leading-relaxed">{integ.desc}</div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </ClaverShell>
  )
}